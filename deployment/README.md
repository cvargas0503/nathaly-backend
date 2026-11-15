# Despliegue de demostración Nathaly

Este entorno ejecuta frontend, backend y SQL Server Express en contenedores. La base utiliza exclusivamente estructura exportada y datos ficticios. No contiene una copia de registros comerciales.

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

`azure/` contiene una ruta de publicación con Azure Container Apps y Azure SQL. La publicación requiere una cuenta y suscripción verificadas, imágenes accesibles y secretos suministrados al entorno. No se registra una URL pública hasta comprobar un despliegue real.

Las cuotas gratuitas no equivalen a capacidad ilimitada. El SQL gratuito debe configurarse para pausarse al agotarse su cuota, y Container Apps debe utilizar Consumption, cero réplicas mínimas y una máxima. Las imágenes se deben almacenar en un registro cuyo plan esté dentro del presupuesto; este procedimiento no crea Azure Container Registry de pago.

## Seguimiento de cambios

Las modificaciones se revisan en ramas `feature/docker-cloud-deployment`. Su promoción sigue el flujo del repositorio. Cada liberación debe registrar los SHA de ambos repositorios, las huellas de las imágenes, las migraciones aplicadas, los resultados de comprobación y el destino verificado. Para retroceder se selecciona una imagen anterior; los cambios de datos requieren una estrategia propia y no deben revertirse eliminando información comercial.
