#requires -Version 7.0
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('Validate','CreateDatabase','DeployApp')][string]$Mode,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F-]{36}$')][string]$SubscriptionId,
    [Parameter(Mandatory)][ValidatePattern('^[a-z0-9-]+$')][string]$Location,
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9_.()-]+$')][string]$ResourceGroup,
    [Parameter(Mandatory)][ValidatePattern('^[a-z][a-z0-9-]{2,61}[a-z0-9]$')][string]$SqlServerName,
    [ValidatePattern('^[a-z][a-z0-9-]{1,29}[a-z0-9]$')][string]$AppName='nathaly-demo',
    [ValidatePattern('^[a-z][a-z0-9-]+$')][string]$EnvironmentName='nathaly-consumption',
    [string]$SqlAdminLogin='nathaly_admin',
    [string]$PrivateEnvironmentFile,
    [string]$FrontendImage,
    [string]$BackendImage,
    [string]$RegistryServer,
    [string]$RegistryIdentityResourceId,
    [string]$AcrBenefitProofFile,
    [ValidatePattern('^[a-z0-9-]{1,20}$')][string]$RevisionSuffix=('r'+(Get-Date -Format 'yyMMddHHmmss')),
    [string]$BootstrapClientIPv4,
    [string]$AzExecutable='az'
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$script:Az=(Get-Command $AzExecutable -ErrorAction Stop).Source
$script:Subscription=$SubscriptionId
$script:TemporaryFiles=[System.Collections.Generic.List[string]]::new()
$dbName='NATHALY_DEMO'
$sqlApi='2023-08-01'
$appApi='2024-03-01'
$sqlId="/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.Sql/servers/$SqlServerName"
$appId="/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.App/containerApps/$AppName"
$environmentId="/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.App/managedEnvironments/$EnvironmentName"

function Field($Object,[string]$Name) {
    if ($null -eq $Object) { return $null }
    $p=$Object.PSObject.Properties[$Name]
    if ($p) { return $p.Value }
    return $null
}
function Invoke-AzJson([string[]]$Arguments) {
    $lines=& $script:Az @Arguments --subscription $script:Subscription --only-show-errors --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Native CLI errors can echo arguments. Keep secret-bearing errors off console/transcripts.
        throw 'Azure CLI returned an error. Inspect the named deployment/resource in Azure; no paid fallback or automatic retry was performed.'
    }
    $json=($lines | ForEach-Object { $_.ToString() }) -join "`n"
    if ([string]::IsNullOrWhiteSpace($json)) { return $null }
    return $json | ConvertFrom-Json -Depth 100
}
function Get-AzureResource([string]$Id,[string]$Api) {
    return Invoke-AzJson @('rest','--method','get','--url',"https://management.azure.com${Id}?api-version=$Api")
}
function Initialize-PrivateDirectory {
    $private=Join-Path $PSScriptRoot '.private'
    [void][IO.Directory]::CreateDirectory($private)
    if ($IsWindows) {
        $acl=[Security.AccessControl.DirectorySecurity]::new()
        $acl.SetAccessRuleProtection($true,$false)
        $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
        $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
        Set-Acl -LiteralPath $private -AclObject $acl
    } else { & chmod 700 -- $private; if ($LASTEXITCODE -ne 0) { throw 'Cannot secure private parameter directory.' } }
    return $private
}
function Write-PrivateJson([object]$Value,[string]$Name) {
    $private=Initialize-PrivateDirectory
    $file=Join-Path $private $Name
    $Value | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $file -Encoding utf8
    if (-not $IsWindows) { & chmod 600 -- $file }
    return $file
}
function Read-PrivateEnvironment {
    if (-not $PrivateEnvironmentFile -or -not (Test-Path -LiteralPath $PrivateEnvironmentFile -PathType Leaf)) { throw 'Provide a local PrivateEnvironmentFile; do not paste secrets into command arguments.' }
    $values=@{}
    foreach ($line in Get-Content -LiteralPath $PrivateEnvironmentFile) {
        if ($line -match '^\s*(#|$)') { continue }
        $parts=$line -split '=',2
        if ($parts.Length -ne 2 -or $parts[0].Trim() -notmatch '^[A-Z][A-Z0-9_]*$') { throw 'Private environment file has an invalid entry.' }
        $value=$parts[1].Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) { $value=$value.Substring(1,$value.Length-2) }
        $values[$parts[0].Trim()]=$value
    }
    return $values
}
function Require-Value([hashtable]$Values,[string]$Name,[int]$Minimum=1) {
    if (-not $Values.ContainsKey($Name) -or $Values[$Name].Length -lt $Minimum) { throw "Fill $Name locally (minimum $Minimum characters)." }
    return $Values[$Name]
}
function Test-IPv4([string]$Address) {
    $parsed=$null
    if (-not [Net.IPAddress]::TryParse($Address,[ref]$parsed) -or $parsed.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork -or $Address -eq '0.0.0.0' -or $Address -eq '255.255.255.255') { throw 'A specific IPv4 address is required; broad Azure-service or all-address firewall rules are not created.' }
}
function New-ParametersFile([hashtable]$Values) {
    $parameters=@{}
    foreach ($entry in $Values.GetEnumerator()) { $parameters[$entry.Key]=@{value=$entry.Value} }
    $path=Write-PrivateJson @{'$schema'='https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#';contentVersion='1.0.0.0';parameters=$parameters} (([guid]::NewGuid().ToString('N'))+'.parameters.private.json')
    $script:TemporaryFiles.Add($path)
    return $path
}
function Deploy-Template([string]$Template,[hashtable]$Values,[string]$Name,[switch]$NoWait) {
    $file=New-ParametersFile $Values
    $base=@('--resource-group',$ResourceGroup,'--name',$Name,'--template-file',(Join-Path $PSScriptRoot $Template),'--mode','Incremental','--parameters',"@$file")
    [void](Invoke-AzJson (@('deployment','group','validate')+$base))
    $arguments=@('deployment','group','create')+$base
    if ($NoWait) { $arguments+='--no-wait' }
    return Invoke-AzJson $arguments
}
function Confirm-FreeDatabase {
    $database=Get-AzureResource "$sqlId/databases/$dbName" $sqlApi
    $properties=Field $database 'properties'
    if ((Field $properties 'useFreeLimit') -ne $true -or (Field $properties 'freeLimitExhaustionBehavior') -ne 'AutoPause' -or [long](Field $properties 'maxSizeBytes') -gt 34359738368) {
        throw 'Database free-tier protection could not be verified. Stop; never substitute a regular billable database.'
    }
    return $database
}
function Add-SqlFirewall([string]$Name,[string]$Address) {
    Test-IPv4 $Address
    [void](Invoke-AzJson @('sql','server','firewall-rule','create','--resource-group',$ResourceGroup,'--server',$SqlServerName,'--name',$Name,'--start-ip-address',$Address,'--end-ip-address',$Address))
}
function Confirm-ExistingAcr([string]$LoginServer) {
    if (-not $AcrBenefitProofFile -or -not (Test-Path -LiteralPath $AcrBenefitProofFile -PathType Leaf)) { throw 'ACR requires locally retained evidence that the specific subscription and Standard registry qualify for the 12-month new-customer benefit.' }
    $proof=Get-Content -LiteralPath $AcrBenefitProofFile -Raw | ConvertFrom-Json
    if ((Field $proof 'subscriptionId') -ne $SubscriptionId -or (Field $proof 'eligibleOfferVerified') -ne $true -or (Field $proof 'benefitName') -ne 'AzureNewCustomerACRStandard12Months') { throw 'ACR benefit evidence does not confirm the intended subscription and offer.' }
    $verifiedAt=[DateTimeOffset]::Parse((Field $proof 'verifiedAtUtc'))
    $expiresAt=[DateTimeOffset]::Parse((Field $proof 'benefitExpiresAtUtc'))
    if ($verifiedAt -gt [DateTimeOffset]::UtcNow -or $expiresAt -le [DateTimeOffset]::UtcNow -or -not (Field $proof 'evidence')) { throw 'ACR benefit evidence is missing, expired or dated in the future.' }
    $registries=@(Invoke-AzJson @('acr','list'))
    $registry=$registries | Where-Object { (Field $_ 'loginServer') -eq $LoginServer } | Select-Object -First 1
    if (-not $registry -or (Field $registry 'id') -ne (Field $proof 'registryResourceId') -or (Field (Field $registry 'sku') 'name') -ne 'Standard') { throw 'The existing registry must match the verified resource and use the Standard SKU.' }
    if (@($registries | Where-Object { (Field (Field $_ 'sku') 'name') -eq 'Standard' }).Count -gt 1) { throw 'Multiple Standard registries make the single-registry free benefit ambiguous; inspect allocation before continuing.' }
    if ((Field $registry 'adminUserEnabled') -eq $true) { throw 'Use a managed pull identity with registry administrator credentials disabled.' }
    if ((Field $registry 'roleAssignmentMode') -eq 'AbacRepositoryPermissions') { throw 'This AcrPull configuration requires registry RBAC mode, not ABAC repository permissions.' }
    if (-not $RegistryIdentityResourceId -or $RegistryIdentityResourceId -notlike "/subscriptions/$SubscriptionId/resourceGroups/*/providers/Microsoft.ManagedIdentity/userAssignedIdentities/*") { throw 'An existing user-assigned registry pull identity in the same subscription is required for ACR.' }
    $identity=Get-AzureResource $RegistryIdentityResourceId '2023-01-31'
    $principal=Field (Field $identity 'properties') 'principalId'
    $registryId=Field $registry 'id'
    $roles=@(Invoke-AzJson @('role','assignment','list','--scope',$registryId,'--all'))
    $pullRole=$roles | Where-Object { (Field $_ 'principalId') -eq $principal -and (Field $_ 'scope') -eq $registryId -and (Field $_ 'roleDefinitionId') -like '*/7f951dda-4ed3-4680-a7ca-43fe172d538d' }
    if (-not $pullRole) { throw 'The user-assigned identity needs AcrPull scoped to this registry before application deployment.' }
    $armAuth=Invoke-AzJson @('acr','config','authentication-as-arm','show','--registry',(Field $registry 'name'))
    if ((Field $armAuth 'status') -ne 'enabled') { throw 'The existing registry must allow ARM-audience token authentication for managed identity image pulls.' }
    Write-Host 'Existing Standard ACR, retained benefit evidence and registry-scoped AcrPull identity checked. No registry or role assignment was created by this script.'
}

try {
    $account=Invoke-AzJson @('account','show')
    if ((Field $account 'id') -ne $SubscriptionId -or (Field $account 'state') -ne 'Enabled') { throw 'Sign in to the intended Azure tenant/subscription before running this script.' }
    $subscription=Get-AzureResource "/subscriptions/$SubscriptionId" '2022-12-01'
    $policies=Field $subscription 'subscriptionPolicies'
    if ((Field $policies 'spendingLimit') -ne 'On') { throw 'This no-paid-overages path requires an active subscription spending limit. Do not disable it or switch to pay-as-you-go as a fallback.' }
    if ((Field $policies 'quotaId') -match 'StudentsStarter') { throw 'Azure for Students Starter is not eligible for the SQL free tier.' }
    $locations=@(Invoke-AzJson @('account','list-locations'))
    if (-not ($locations | Where-Object { (Field $_ 'name') -eq $Location })) { throw 'The selected Azure region is not available in this subscription.' }
    foreach ($namespace in @('Microsoft.Sql','Microsoft.App')) {
        $provider=Invoke-AzJson @('provider','show','--namespace',$namespace)
        if ((Field $provider 'registrationState') -ne 'Registered') { throw "Register $namespace in the intended subscription first, then rerun validation. This script does not silently register providers." }
        $typeName=if ($namespace -eq 'Microsoft.App') {'managedEnvironments'} else {'servers'}
        $resourceType=@(Field $provider 'resourceTypes') | Where-Object { (Field $_ 'resourceType') -eq $typeName }
        $displayName=Field ($locations | Where-Object { (Field $_ 'name') -eq $Location } | Select-Object -First 1) 'displayName'
        if (-not (@(Field ($resourceType | Select-Object -First 1) 'locations') -contains $displayName)) { throw "$namespace is not available in the selected region." }
    }

    $capabilities=Get-AzureResource "/subscriptions/$SubscriptionId/providers/Microsoft.Sql/locations/$Location/capabilities" $sqlApi
    $eligible=@()
    foreach ($version in @(Field $capabilities 'supportedServerVersions')) {
        foreach ($edition in @(Field $version 'supportedEditions')) {
            if ((Field $edition 'name') -ne 'GeneralPurpose') { continue }
            foreach ($objective in @(Field $edition 'supportedServiceLevelObjectives')) {
                $sku=Field $objective 'sku'
                if ((Field $objective 'status') -notin @('Available','Default') -or (Field $sku 'name') -ne 'GP_S_Gen5' -or (Field $sku 'capacity') -ne 2) { continue }
                foreach ($behavior in @(Field $objective 'supportedFreeLimitExhaustionBehaviors')) {
                    if ((Field $behavior 'exhaustionBehaviorType') -eq 'AutoPause' -and (Field $behavior 'status') -in @('Available','Default')) { $eligible+=$objective }
                }
            }
        }
    }
    if ($eligible.Count -eq 0) { throw 'The subscription/region API did not confirm GP_S_Gen5 capacity 2 with free-limit AutoPause. Stop instead of creating a paid substitute.' }
    $usages=Get-AzureResource "/subscriptions/$SubscriptionId/providers/Microsoft.Sql/locations/$Location/usages" $sqlApi
    $freeMetric=@(Field $usages 'value') | Where-Object { (Field $_ 'name') -eq 'SubscriptionFreeDatabaseCount' } | Select-Object -First 1
    $servers=@(Invoke-AzJson @('sql','server','list'))
    $existingTarget=$null
    foreach ($server in $servers) {
        $serverId=Field $server 'id'
        $databases=Get-AzureResource "$serverId/databases" $sqlApi
        foreach ($database in @(Field $databases 'value')) {
            if ((Field $database 'id') -eq "$sqlId/databases/$dbName") { $existingTarget=$database }
            if ((Field (Field $database 'properties') 'useFreeLimit') -eq $true -and (Field $database 'location') -ne $Location) { throw 'A free-tier database already selects a different subscription region. Do not create another region as a fallback.' }
        }
    }
    if (-not $existingTarget -and $freeMetric) {
        $metric=Field $freeMetric 'properties'
        if ([double](Field $metric 'currentValue') -ge [double](Field $metric 'limit')) { throw 'Azure reports no free database slots available in this region.' }
    }
    Write-Host 'Preflight passed: explicit subscription, enabled spending limit, region, serverless SKU and AutoPause capability checked.'
    if ($RegistryServer -match '\.azurecr\.io$') { Confirm-ExistingAcr $RegistryServer }
    elseif ($RegistryIdentityResourceId) { throw 'RegistryIdentityResourceId requires an existing Azure Container Registry login server.' }
    if ($Mode -eq 'Validate') { return }
    $privateValues=Read-PrivateEnvironment

    if ($Mode -eq 'CreateDatabase') {
        $groupExists=Invoke-AzJson @('group','exists','--name',$ResourceGroup)
        if (-not $groupExists) { [void](Invoke-AzJson @('group','create','--name',$ResourceGroup,'--location',$Location,'--tags','project=nathaly','purpose=academic-demo')) }
        $server=$servers | Where-Object { (Field $_ 'id') -eq $sqlId } | Select-Object -First 1
        if (-not $server) {
            $password=Require-Value $privateValues 'SQL_ADMIN_PASSWORD' 16
            [void](Deploy-Template 'server.arm.json' @{serverName=$SqlServerName;location=$Location;adminLogin=$SqlAdminLogin;adminPassword=$password} 'nathaly-sql-server')
        } elseif ((Field $server 'location') -ne $Location) { throw 'Existing logical server is in another region; no existing server was modified.' }
        if (-not $existingTarget) { [void](Deploy-Template 'database.arm.json' @{serverName=$SqlServerName;databaseName=$dbName;location=$Location} 'nathaly-free-database') }
        $database=Confirm-FreeDatabase
        if ($BootstrapClientIPv4) { Add-SqlFirewall 'nathaly-bootstrap-client' $BootstrapClientIPv4 }
        Write-Host 'NATHALY_DEMO exists and useFreeLimit=true / AutoPause / max32GB were verified. Initialize the demo schema and a separate runtime user before DeployApp.'
        return
    }

    [void](Confirm-FreeDatabase)
    if (-not $FrontendImage -or -not $BackendImage) { throw 'Provide pullable frontend and backend image references; local Docker image names cannot be pulled by Azure.' }
    if ($FrontendImage -notmatch '/' -or $BackendImage -notmatch '/') { throw 'Use remote registry/namespace image references, preferably digest-pinned; no paid registry is created.' }
    $databaseUser=Require-Value $privateValues 'DB_USER'
    $databasePassword=Require-Value $privateValues 'DB_PASSWORD'
    $jwt=Require-Value $privateValues 'JWT_SECRET' 32
    $pullRegistryServer=if($RegistryServer){$RegistryServer}elseif($privateValues.ContainsKey('REGISTRY_SERVER')){$privateValues['REGISTRY_SERVER']}else{''}
    $registryUsername='';$registryPassword=''
    if ($pullRegistryServer -match '\.azurecr\.io$' -and -not $RegistryServer) { Confirm-ExistingAcr $pullRegistryServer }
    if ($pullRegistryServer -and -not $RegistryIdentityResourceId) { $registryUsername=Require-Value $privateValues 'REGISTRY_USERNAME';$registryPassword=Require-Value $privateValues 'REGISTRY_PASSWORD' }
    [void](Deploy-Template 'environment.arm.json' @{environmentName=$EnvironmentName;location=$Location} 'nathaly-consumption-environment')
    $environment=Get-AzureResource $environmentId $appApi
    $domain=Field (Field $environment 'properties') 'defaultDomain'
    if (-not $domain) { throw 'Azure did not return the environment domain; no application URL was assumed.' }
    $origin="https://$AppName.$domain"
    $values=@{appName=$AppName;environmentName=$EnvironmentName;location=$Location;frontendImage=$FrontendImage;backendImage=$BackendImage;frontendOrigin=$origin;databaseHost="$SqlServerName.database.windows.net";databaseName=$dbName;databaseUser=$databaseUser;databasePassword=$databasePassword;jwtSecret=$jwt;registryServer=$pullRegistryServer;registryIdentityResourceId=$RegistryIdentityResourceId;registryUsername=$registryUsername;registryPassword=$registryPassword;revisionSuffix=$RevisionSuffix}
    $deployment='nathaly-app-'+$RevisionSuffix
    [void](Deploy-Template 'app.arm.json' $values $deployment -NoWait)
    $app=$null;$ips=@()
    for ($attempt=0;$attempt -lt 24;$attempt++) {
        Start-Sleep -Seconds 5
        # Inspect provisioning state rather than retrying app creation if its outcome is uncertain.
        $app=Get-AzureResource $appId $appApi
        $ips=@(Field (Field $app 'properties') 'outboundIpAddresses') | Where-Object { $_ }
        if ($ips.Count -gt 0) { break }
    }
    if ($ips.Count -eq 0) { throw 'Azure did not return app outbound addresses. Deployment may still be running; inspect it before retrying. No broad SQL firewall rule was created.' }
    $counter=0
    foreach ($ip in ($ips | Sort-Object -Unique)) { Add-SqlFirewall ('nathaly-app-outbound-'+$counter.ToString('00')) $ip; $counter++ }
    [void](Invoke-AzJson @('deployment','group','wait','--resource-group',$ResourceGroup,'--name',$deployment,'--created','--timeout','1800'))
    $app=Get-AzureResource $appId $appApi
    $properties=Field $app 'properties'
    if ((Field $properties 'provisioningState') -ne 'Succeeded') { throw 'The application provisioning state is not Succeeded.' }
    $latestRevision=Field $properties 'latestRevisionName'
    if (-not $latestRevision -or (Field $properties 'latestReadyRevisionName') -ne $latestRevision) { throw 'The latest application revision is not ready; do not report a completed deployment.' }
    $fqdn=Field (Field (Field $properties 'configuration') 'ingress') 'fqdn'
    if (-not $fqdn) { throw 'The ready application did not return an ingress FQDN.' }
    [void](Confirm-FreeDatabase)
    $response=Invoke-WebRequest -Uri "https://$fqdn/healthz" -TimeoutSec 90
    if ($response.StatusCode -ne 200) { throw 'Public frontend health check did not succeed.' }
    $health=$response.Content | ConvertFrom-Json
    if ((Field $health 'status') -ne 'ok' -or (Field $health 'service') -ne 'frontend') { throw 'Public health endpoint did not identify the expected frontend image.' }
    $state=@{subscriptionId=$SubscriptionId;resourceGroup=$ResourceGroup;location=$Location;sqlServerName=$SqlServerName;databaseName=$dbName;appName=$AppName;environmentName=$EnvironmentName;frontendImage=$FrontendImage;backendImage=$BackendImage;revisionSuffix=$RevisionSuffix;url="https://$fqdn";checkedUtc=[DateTime]::UtcNow.ToString('o')}
    [void](Write-PrivateJson $state 'deployment.state.json')
    Write-Host "Azure returned a ready application: https://$fqdn"
    Write-Host 'Frontend health verified. Complete login, database-backed requests, invoice retry and report checks before reporting full functional acceptance.'
} finally {
    foreach ($file in $script:TemporaryFiles) { if (Test-Path -LiteralPath $file -PathType Leaf) { Remove-Item -LiteralPath $file -Force } }
}
