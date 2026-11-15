#requires -Version 7.0
$ErrorActionPreference='Stop'
function Assert([bool]$Condition,[string]$Message) { if (-not $Condition) { throw $Message } }
$allowed=@('Microsoft.Sql/servers','Microsoft.Sql/servers/databases','Microsoft.App/managedEnvironments','Microsoft.App/containerApps')
$resources=@(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.arm.json' | ForEach-Object { (Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json -Depth 100).resources })
Assert ($resources.Count -eq 4) 'Unexpected infrastructure resource count.'
foreach ($resource in $resources) { Assert ($resource.type -in $allowed) "Unexpected potentially chargeable resource type: $($resource.type)" }
$db=$resources | Where-Object type -eq 'Microsoft.Sql/servers/databases'
Assert ($db.sku.name -eq 'GP_S_Gen5' -and $db.sku.capacity -eq 2) 'Database is not the intended serverless SKU.'
Assert ($db.properties.useFreeLimit -eq $true -and $db.properties.freeLimitExhaustionBehavior -eq 'AutoPause') 'SQL free limit guard is missing.'
Assert ($db.properties.maxSizeBytes -eq 34359738368 -and $db.properties.requestedBackupStorageRedundancy -eq 'Local') 'SQL storage settings differ from the reviewed free configuration.'
$environment=$resources | Where-Object type -eq 'Microsoft.App/managedEnvironments'
Assert ($null -eq $environment.properties.appLogsConfiguration.destination -and -not $environment.properties.appLogsConfiguration.PSObject.Properties['logAnalyticsConfiguration']) 'Persistent paid log export is enabled.'
Assert ($environment.properties.workloadProfiles.Count -eq 1 -and $environment.properties.workloadProfiles[0].workloadProfileType -eq 'Consumption') 'A non-Consumption workload profile was added.'
$app=$resources | Where-Object type -eq 'Microsoft.App/containerApps'
Assert ($app.identity -match 'registryIdentityResourceId' -and $app.properties.configuration.registries -match 'registryIdentityResourceId') 'Managed identity must be attached and used for registry pulls.'
Assert ($app.properties.template.containers.Count -eq 2) 'Both frontend and backend containers are required.'
Assert ($app.properties.template.scale.minReplicas -eq 0 -and $app.properties.template.scale.maxReplicas -eq 1) 'Replica count exceeds the reviewed demo.'
Assert ($app.properties.configuration.ingress.targetPort -eq 8080 -and $app.properties.configuration.ingress.allowInsecure -eq $false) 'Public ingress must be HTTPS through the frontend.'
$backend=$app.properties.template.containers | Where-Object name -eq 'backend'
foreach ($name in @('DB_PASSWORD','JWT_SECRET')) {
    $entry=$backend.env | Where-Object name -eq $name
    Assert ($entry.secretRef -and -not $entry.PSObject.Properties['value']) "$name must use a secret reference."
}
$tokens=$null;$parseErrors=$null
[void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Deploy-Azure.ps1'),[ref]$tokens,[ref]$parseErrors)
Assert ($parseErrors.Count -eq 0) 'Deployment script has PowerShell parser errors.'
Write-Output 'PASS: local syntax and no-paid-resource policy checks. Azure account/region/provider eligibility and live deployment remain unverified.'
