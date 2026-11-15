# Despliegue de demostración Nathaly

La aplicación dispone de una composición local con frontend, backend y SQL Server Express en contenedores, y de una publicación en Azure Container Apps con frontend y backend dockerizados y persistencia en Azure SQL. La base utiliza estructura revisada y datos ficticios; no contiene una copia de registros comerciales.

Acceso público verificado: [aplicación de demostración](https://nathaly-demo.calmbay-82b9da56.eastus2.azurecontainerapps.io).

## Requisitos y arranque

- Docker Engine y Docker Compose v2 en Linux x86-64. SQL Server requiere suficientes recursos; se recomienda al menos 4 GB libres para el conjunto.
- Repositorios clonados en carpetas `backend` y `frontend`. No copiar archivos `.env` a Git ni a las imágenes.
- Copiar `.env.example` a `.env` y generar valores privados diferentes para el administrador SQL, el usuario SQL de aplicación, el usuario demo y la firma JWT.
- Ejecutar `docker compose up --build -d` desde este directorio. La inicialización aplica la estructura base, datos ficticios y migraciones antes de arrancar la API.
- Acceder a `http://localhost:8080`. El usuario de demostración es `demo.admin`; su contraseña se obtiene de `DEMO_ADMIN_PASSWORD` en el entorno privado.

La API usa un login SQL distinto del administrador, sin permisos de creación de tablas. Solamente Nginx publica un puerto en el equipo local; SQL Server y la API permanecen en la red interna. Los datos SQL y los archivos subidos utilizan volúmenes persistentes. `docker compose down` conserva los volúmenes; no usar `down -v` salvo que se desee eliminar la demostración y se hayan revisado las consecuencias.

## Configuración y validación

El frontend utiliza `/api/v1` en el mismo origen y Nginx envía las solicitudes al backend. La configuración del navegador es pública; las claves JWT y contraseñas pertenecen al entorno del servidor. En la configuración local se confía explícitamente en el certificado autofirmado del SQL de demostración. La nube debe utilizar TLS verificado y no debe reutilizar esta excepción.

Las comprobaciones separan `/healthz` de Nginx, `/health` del proceso API y `/ready` de la conexión de base de datos. Las verificaciones funcionales deben incluir inicio de sesión, perfil, productos, facturación, idempotencia y cierre de sesión. Una imagen construida no acredita por sí sola esas operaciones.

Chromium se instala en la imagen API para los reportes. La opción local `CHROMIUM_DISABLE_SANDBOX=true` es explícita porque el host Docker no siempre permite su sandbox de espacios de nombres; la API sigue ejecutándose como usuario no privilegiado. La opción debe revisarse según el alojamiento.

## Publicación en nube

`azure/` contiene los manifiestos y el procedimiento de publicación. Azure Container Apps utiliza Consumption en East US 2, con dos contenedores en una misma aplicación: Nginx recibe el ingreso HTTPS y envía las solicitudes al backend en `127.0.0.1:3000`. La base Azure SQL se encuentra en Central US. Esta organización conserva el backend como monolito modular; no separa sus módulos comerciales en microservicios.

Las imágenes se almacenan en un ACR Standard privado y se recuperan mediante una identidad administrada con acceso de lectura. Los secretos SQL y JWT se suministran al entorno, sin incorporarlos a las imágenes ni a Git. La API valida el certificado TLS de Azure SQL; no se utiliza la excepción de certificado autofirmado de la demostración local.

La regla de conectividad `AzureResources` se ha delimitado exclusivamente a la base `NATHALY_DEMO`. Permitir recursos Azure no equivale a una red privada ni a aislamiento frente a otras cuentas de Azure: otros recursos de la plataforma pueden intentar establecer conexiones y siguen necesitando credenciales válidas y permisos. Mantener TLS verificado, contraseñas robustas y la cuenta SQL de aplicación separada del administrador. No ampliar esta regla a todas las bases del servidor.

### Verificación pública y actualización

Las revisiones r1 y r2 alcanzaron estado saludable y cada una superó dieciséis comprobaciones HTTP públicas. Los casos incluyen autenticación, perfil, productos, dashboard, datos de facturación, ventas, reportes y revocación de sesión.

- Crear una factura devuelve 201; repetir la misma solicitud y clave devuelve 200; cambiar el contenido con la misma clave devuelve 409.
- La factura creada antes de la actualización se conserva en r2. Repetir esa solicitud después del reemplazo devuelve la misma factura y `reutilizada=true`, sin registrar otra venta.
- La exportación PDF final devuelve un documento de 35 428 bytes.
- Después del cierre de sesión, reutilizar la sesión anterior para consultar el perfil devuelve 401.
- Las comprobaciones del navegador permiten acceder al dashboard, productos y facturas sin errores de página registrados.
- Un reinicio controlado de r2 crea una nueva réplica, habilita ambos contenedores y recupera la factura existente sin reglas de IP de ejecución. No se ha medido un ciclo de inactividad hasta cero réplicas.

Las imágenes de la actualización identifican las revisiones de código `3926aa2` del backend y `f2e2646` del frontend. Las huellas de las imágenes permiten relacionar estos artefactos con la revisión publicada. Estos resultados acreditan los casos evaluados; no constituyen una prueba de carga ni una certificación de todos los módulos.

### Cuotas almacenamiento y vigencia

Container Apps mantiene cero réplicas mínimas y una máxima. La base utiliza el beneficio SQL con `useFreeLimit=true`, un máximo de 32 GB y `freeLimitExhaustionBehavior=AutoPause`. La suscripción conserva `spendingLimit=On`. Estos controles no representan capacidad ilimitada ni garantizan disponibilidad permanente.

El beneficio de ACR Standard cubre un registro durante doce meses cuando la cuenta es elegible. La suscripción de prueba puede suspenderse al finalizar sus treinta días o agotarse el crédito, aunque otro beneficio tenga una vigencia mayor. Revisar el estado de los recursos, las cuotas y el vencimiento de la suscripción antes de utilizar el entorno; no asumir gratuidad permanente.

Azure SQL mantiene la información relacional entre revisiones. El contenedor del backend no dispone de un volumen persistente para cargas de archivos en la configuración de nube actual. Los archivos pueden perderse al reemplazar o reducir las réplicas; incorporar almacenamiento externo y respaldos antes de conservar archivos reales. Esta limitación no debe confundirse con los volúmenes persistentes de la composición local.

## Seguimiento de cambios

Las modificaciones se revisan en ramas `feature/docker-cloud-deployment`. El backend conserva la promoción `feature → develop → qa → master`; el frontend presenta sus contribuciones mediante pull requests hacia `main`.

Las propuestas de integración son [PR 21 del backend hacia develop](https://github.com/cvargas0503/nathaly-backend/pull/21) y [PR 3 del frontend hacia main](https://github.com/cvargas0503/front-nathaly/pull/3). La publicación de demostración no equivale a su integración: ambos pull requests permanecen sujetos a revisión y no se han mezclado como parte de este despliegue.

Cada liberación debe registrar los SHA de ambos repositorios, las huellas de las imágenes, las migraciones aplicadas, los resultados de comprobación y el destino verificado. Para retroceder se selecciona una imagen anterior; los cambios de datos requieren una estrategia propia y no deben revertirse eliminando información comercial.
