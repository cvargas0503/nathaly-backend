# Despliegue de demostración en Azure

Estado: archivos preparados y comprobados localmente. Aún se requieren una sesión de Azure, una suscripción elegible, imágenes accesibles desde un registro y la inicialización de la base. Estos archivos no demuestran que exista un despliegue en la nube ni contienen una URL inventada.

## Componentes

Una Container App contiene dos contenedores Linux amd64: Nginx entrega el frontend por el puerto 8080 y reenvía `/api/` y `/uploads/` al backend en `127.0.0.1:3000`. Ambos comparten la red de la réplica. El ingreso público proporciona HTTPS y rechaza HTTP sin cifrar. El backend se conecta con TLS a una base Azure SQL nueva llamada `NATHALY_DEMO`.

Los manifiestos separan el servidor lógico, la base, el entorno Consumption y la aplicación. La aplicación utiliza una revisión activa, cero réplicas mínimas y una máxima. El entorno no habilita Log Analytics ni crea ACR, NAT Gateway, máquinas virtuales, almacenamiento o perfiles Dedicated. Las credenciales se pasan como parámetros ARM `securestring` y secretos de Container Apps; no se incluyen en las imágenes ni en los parámetros de la línea de comandos.

## Condiciones de gratuidad

La base utiliza `GP_S_Gen5`, capacidad 2, `useFreeLimit=true`, `freeLimitExhaustionBehavior=AutoPause`, datos hasta 32 GB y respaldo Local. Al alcanzar el límite gratuito mensual se pausa. No se permite convertirla automáticamente a una base ordinaria ni habilitar cargos adicionales.

Consumption incluye cantidades gratuitas mensuales compartidas por la suscripción, pero `minReplicas=0` y `maxReplicas=1` no son un límite monetario. CPU, memoria, solicitudes o transferencia que excedan las cantidades aplicables pueden generar cargos. El script exige que la API de la suscripción devuelva `spendingLimit=On`. No desactiva el límite ni cambia el tipo de suscripción. Si el proveedor no permite ese control, el procedimiento se detiene para conservar el requisito de no introducir cargos; no debe modificarse para asumir que toda cuenta Azure es gratuita.

Antes de crear recursos, el script comprueba la suscripción y región explícitas, el registro de los proveedores, la capacidad serverless con AutoPause y las cuotas disponibles. También comprueba si una base gratuita existente ya fija otra región. Microsoft Azure for Students Starter no es compatible. La respuesta del proveedor es la autoridad para la elegibilidad; la comprobación local de los manifiestos no sustituye esa consulta.

## Preparación

Se requieren PowerShell 7 y Azure CLI accesible en el mismo entorno. Iniciar sesión personalmente mediante `az login`, seleccionar la cuenta apropiada y verificar la suscripción. La automatización de los archivos no inicia sesión, no crea cuentas y no interviene en MFA.

Si falta el registro de proveedores, realizarlo en la suscripción prevista y volver a validar:

```powershell
az provider register --namespace Microsoft.Sql --wait --subscription '<subscription-id>'
az provider register --namespace Microsoft.App --wait --subscription '<subscription-id>'
```

Definir el destino con nombres nuevos y una región que la suscripción permita:

```powershell
$target = @{
    SubscriptionId = '<subscription-id>'
    Location = '<region-name>'
    ResourceGroup = 'rg-nathaly-demo'
    SqlServerName = '<globally-unique-sql-server-name>'
}
./Deploy-Azure.ps1 -Mode Validate @target
```

`-SqlLocation` permite utilizar una región SQL distinta de `Location` cuando la suscripción restringe la creación de SQL en la región de la aplicación. Si se omite, toma el valor de `Location`. Confirmar primero la disponibilidad mediante Capabilities y conservar la primera región elegida por la oferta gratuita. Este parámetro no mueve el registro ni el entorno de contenedores existentes.

Copiar `.env.azure.example` a un archivo privado excluido del control de versiones y completarlo localmente. Las contraseñas deben ser distintas de las usadas en entornos reales. El script lee ese archivo sin ejecutarlo y no imprime sus valores. Los archivos de parámetros que genera se protegen con permisos de usuario y se eliminan al finalizar; `.private` está excluido de Git. No iniciar una transcripción de PowerShell ni utilizar `--debug` durante operaciones con secretos.

## Base de datos e inicialización

```powershell
./Deploy-Azure.ps1 -Mode CreateDatabase @target `
    -PrivateEnvironmentFile '<private-env-path>' `
    -BootstrapClientIPv4 '<specific-public-ipv4>'
```

La regla opcional de inicialización permite exclusivamente la IPv4 indicada. No se abre `0.0.0.0`, una red completa ni el acceso general de todos los servicios Azure. El script comprueba los límites de gratuidad después de la creación y no modifica servidores existentes para cambiar su contraseña.

Esta fase crea una base vacía. Aplicar después los scripts de esquema y migración preparados para la demostración, datos ficticios y un usuario de aplicación distinto del administrador. Los scripts deben conectarse directamente a `NATHALY_DEMO` y ser compatibles con Azure SQL. No restaurar una base empresarial o un respaldo `.bak` en esta oferta, ni publicar datos de personas o credenciales reales. Comprobar el inicio de sesión del usuario de aplicación antes de continuar.

## Imágenes y aplicación

Publicar las dos imágenes construidas en un registro existente que Azure pueda consultar. Una etiqueta presente únicamente en Docker local no es suficiente. Preferir referencias con digest para relacionar cada revisión con el artefacto exacto. El script no crea un registro de pago. Para imágenes privadas de un mismo registro, completar `REGISTRY_SERVER`, `REGISTRY_USERNAME` y `REGISTRY_PASSWORD` en el archivo privado; dejar esos campos vacíos si las dos imágenes son públicas. La credencial debe permitir lectura de las imágenes: los permisos de acceso a un repositorio Git no implican acceso a paquetes de contenedores.

```powershell
./Deploy-Azure.ps1 -Mode DeployApp @target `
    -PrivateEnvironmentFile '<private-env-path>' `
    -FrontendImage '<registry>/<namespace>/<frontend>@sha256:<digest>' `
    -BackendImage '<registry>/<namespace>/<backend>@sha256:<digest>' `
    -RevisionSuffix 'r20261114a'
```

El script crea el entorno Consumption sin exportación de logs y calcula el origen HTTPS a partir del dominio que Azure devuelve. Inicia el despliegue de la aplicación y consulta sus direcciones de salida para crear reglas SQL específicas por IPv4. El direccionamiento de salida puede cambiar; volver a comprobar las reglas al modificar la red del entorno. No se usa la IP de ingreso como si fuera una garantía de salida. Si Azure no devuelve las direcciones necesarias, la operación se detiene y debe inspeccionarse el despliegue en curso antes de reintentar.

La aplicación requiere que las imágenes estén disponibles y que la base ya esté inicializada. La prueba pública `/healthz` demuestra la respuesta del frontend. Las sondas internas `/health` y `/ready` comprueban el proceso del backend y una consulta SQL. Aún deben comprobarse autenticación, permisos, operaciones de inventario, facturación con reintentos y generación de reportes. Solamente después de esas comprobaciones corresponde declarar la aceptación funcional completa.

## Registro ACR Standard con beneficio gratuito verificado

La oferta para clientes Azure nuevos incluye un registro Standard con 100 GB y diez webhooks durante doce meses. No se aplica automáticamente a cualquier suscripción ni equivale a un registro gratuito permanente. Antes de crear uno, comprobar en la cuenta y en sus servicios gratuitos que el beneficio está activo, que no existe otro registro consumiendo la asignación y que el límite de gasto permanece habilitado. Conservar la evidencia y la fecha de vencimiento. No habilitar ACR Tasks, compilaciones remotas, replicación Premium ni servicios adicionales.

La creación del registro y de su identidad es una fase explícita fuera de `Deploy-Azure.ps1`; el script de aplicación solo reutiliza recursos existentes y verifica su configuración. Después de confirmar el beneficio y los nombres previstos, los comandos de preparación son:

```powershell
az acr create --name '<registry-name>' --resource-group '<resource-group>' `
    --location '<region>' --sku Standard --admin-enabled false `
    --role-assignment-mode rbac --subscription '<subscription-id>'

az identity create --name 'nathaly-image-pull' --resource-group '<resource-group>' `
    --location '<region>' --subscription '<subscription-id>'

$acr = az acr show --name '<registry-name>' --subscription '<subscription-id>' -o json | ConvertFrom-Json
$pull = az identity show --name 'nathaly-image-pull' --resource-group '<resource-group>' `
    --subscription '<subscription-id>' -o json | ConvertFrom-Json

az role assignment create --assignee-object-id $pull.principalId `
    --assignee-principal-type ServicePrincipal `
    --role '7f951dda-4ed3-4680-a7ca-43fe172d538d' --scope $acr.id `
    --subscription '<subscription-id>' --output none

az acr config authentication-as-arm show --registry '<registry-name>' `
    --subscription '<subscription-id>'
```

La asignación `AcrPull` se limita al recurso del registro. El manifiesto adjunta la identidad existente a la aplicación y la referencia desde `configuration.registries`; en ese modo no crea un secreto de contraseña del registro. Si la autenticación con audiencia ARM aparece deshabilitada, revisar y habilitar explícitamente la configuración necesaria antes del despliegue. No activar el usuario administrador como solución alternativa. La propagación de RBAC puede demorar; un fallo de extracción no autoriza ampliar el rol a toda la suscripción.

Para publicar las imágenes construidas localmente, utilizar la identidad de la sesión Azure. En un equipo con Docker dentro de WSL se puede pasar el token temporal por la entrada estándar sin imprimirlo:

```powershell
$token = az acr login --name '<registry-name>' --expose-token `
    --subscription '<subscription-id>' --query accessToken --output tsv
$token | wsl -d Ubuntu -u root -- docker login $acr.loginServer `
    --username '00000000-0000-0000-0000-000000000000' --password-stdin
$token = $null

wsl -d Ubuntu -u root -- docker tag nathaly-frontend:docker-cloud "$($acr.loginServer)/nathaly-frontend:r20261114a"
wsl -d Ubuntu -u root -- docker tag nathaly-backend:docker-cloud "$($acr.loginServer)/nathaly-backend:r20261114a"
wsl -d Ubuntu -u root -- docker push "$($acr.loginServer)/nathaly-frontend:r20261114a"
wsl -d Ubuntu -u root -- docker push "$($acr.loginServer)/nathaly-backend:r20261114a"
```

Completar una copia privada de `ACR-benefit.example.json` con la suscripción, el recurso y las fechas reales después de revisar el beneficio; el valor de ejemplo `eligibleOfferVerified=false` impide tratar una plantilla sin revisar como evidencia. Este archivo registra la comprobación del operador y no sustituye los datos de facturación de Azure. El script verifica que el recurso y la vigencia coincidan, que el registro sea Standard y tenga el administrador desactivado, y que la identidad disponga de `AcrPull` en ese registro. No crea ni amplía roles automáticamente.

```powershell
./Deploy-Azure.ps1 -Mode DeployApp @target `
    -PrivateEnvironmentFile '<private-env-path>' `
    -FrontendImage "$($acr.loginServer)/nathaly-frontend@sha256:<actual-digest>" `
    -BackendImage "$($acr.loginServer)/nathaly-backend@sha256:<actual-digest>" `
    -RegistryServer $acr.loginServer `
    -RegistryIdentityResourceId $pull.id `
    -AcrBenefitProofFile '<private-reviewed-benefit-evidence-json>' `
    -RevisionSuffix 'r20261114a'
```

En este modo no se necesitan `REGISTRY_USERNAME` ni `REGISTRY_PASSWORD`. El beneficio Standard deja de cubrir el recurso al vencer sus condiciones; retirar o reevaluar el registro antes de esa fecha y mantener el límite de gasto. No utilizar esta configuración para justificar una promesa de costo cero sin comprobar el consumo real.

## Actualización y seguimiento

Construir imágenes nuevas desde commits identificados, publicarlas con etiquetas inmutables o digest y ejecutar `DeployApp` con un sufijo de revisión nuevo. Los límites de gratuidad vuelven a comprobarse antes del cambio. El archivo privado `.private/deployment.state.json` conserva los identificadores, imágenes, revisión y URL que efectivamente devolvió Azure; no guarda contraseñas. Revisar el estado de la revisión y los casos funcionales antes de considerar completada la actualización.

Los archivos de `/app/uploads` permanecen en el almacenamiento efímero del contenedor y se pierden al reemplazar una réplica o escalar a cero. La base Azure SQL conserva sus datos por separado. Este perfil de demostración no acredita persistencia de imágenes subidas ni disponibilidad continua: una pausa de SQL o un arranque en frío puede impedir temporalmente la atención de solicitudes. La persistencia de archivos y la operación permanente requieren una decisión de almacenamiento y presupuesto distinta; estos manifiestos no crean esos servicios de forma implícita.

No eliminar grupos compartidos ni bases preexistentes. Para finalizar la demostración, revisar los recursos efectivamente creados en el grupo del proyecto, retirar la regla temporal de inicialización cuando deje de ser necesaria y cerrar herramientas de consulta para permitir la pausa de SQL. Consultar el consumo real y el límite de gasto en Azure; no presentar las cuotas teóricas como una factura verificada de cero.

## Fuentes técnicas oficiales

- [Azure SQL Database free tier](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier?view=azuresql)
- [SQL free tier eligibility and limits](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq?view=azuresql)
- [SQL capabilities by subscription and region](https://learn.microsoft.com/en-us/rest/api/sql/capabilities/list-by-location?view=rest-sql-2023-08-01)
- [SQL subscription usage and quotas](https://learn.microsoft.com/en-us/rest/api/sql/subscription-usages/list-by-location?view=rest-sql-2023-08-01)
- [Subscription policies and spending limit](https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/get?view=rest-resources-2022-12-01)
- [Container Apps containers](https://learn.microsoft.com/en-us/azure/container-apps/containers)
- [Container Apps billing](https://learn.microsoft.com/en-us/azure/container-apps/billing)
- [Managed environment manifest and log destination](https://learn.microsoft.com/en-us/azure/templates/microsoft.app/2024-03-01/managedenvironments)
- [Container App manifest](https://learn.microsoft.com/en-us/azure/templates/microsoft.app/2024-03-01/containerapps)
- [Azure CLI resource-group deployment](https://learn.microsoft.com/en-us/cli/azure/deployment/group?view=azure-cli-latest)
- [Azure free account and included ACR Standard benefit](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account)
- [Container Apps image pull with managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull)
- [Azure CLI ACR creation and RBAC mode](https://learn.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest#az-acr-create)
