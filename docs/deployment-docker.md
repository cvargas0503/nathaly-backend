# Ejecución del backend en Docker

La imagen utiliza Node.js 24, compilación TypeScript en una etapa separada y un usuario sin privilegios para ejecutar la API. Incluye Chromium del sistema para generar reportes PDF y `dumb-init` para transmitir las señales de parada.

## Construcción

```sh
docker build -t nathaly-backend:local .
```

La construcción instala las versiones del archivo `package-lock.json` mediante `npm ci`. No incorpora `.env`, credenciales, respaldos, archivos subidos ni dependencias del equipo anfitrión. La imagen de ejecución contiene las dependencias de producción y el código compilado.

## Configuración de ejecución

Preparar un archivo privado de entorno a partir de `.env.example`. Las credenciales se proporcionan al ejecutar el contenedor o mediante los secretos del proveedor, nunca como argumentos de construcción.

```sh
docker volume create nathaly-uploads
docker run --name nathaly-api --init --env-file .env \
  -p 127.0.0.1:3000:3000 \
  --mount source=nathaly-uploads,target=/app/uploads \
  nathaly-backend:local
```

En una composición de contenedores, `DB_HOST` debe identificar el servicio SQL Server en la red privada, en lugar de `localhost`. La API escucha en `0.0.0.0` y utiliza `PORT=3000` si no se configura otro puerto.

En producción, utilizar HTTPS en el punto de entrada público y una configuración de `CORS_ORIGINS` coherente con la dirección del frontend. Las cookies de sesión utilizan `Secure` cuando `NODE_ENV=production`. Es preferible exponer API e interfaz bajo el mismo origen mediante un proxy inverso, manteniendo SQL Server y el puerto interno de la API fuera de la red pública.

| Variable | Función |
| --- | --- |
| `PORT` | Puerto HTTP del proceso, 3000 por defecto. |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Destino de persistencia. |
| `DB_USER`, `DB_PASSWORD` | Credenciales privadas de la cuenta de aplicación. |
| `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE` | Política TLS de conexión a SQL Server. |
| `JWT_SECRET` | Clave privada con una longitud mínima de 32 caracteres. |
| `CORS_ORIGINS` | Orígenes permitidos separados por comas. |
| `UPLOADS_DIR` | Directorio de archivos persistentes, `/app/uploads` en la imagen. |
| `DB_CONNECT_ATTEMPTS` | Intentos iniciales de conexión, entre 1 y 60; valor predeterminado 30, con dos segundos entre intentos fallidos. El tiempo de conexión de cada intento se añade a esa espera. |
| `PUPPETEER_EXECUTABLE_PATH` | Ejecutable Chromium, `/usr/bin/chromium` en la imagen. |
| `CHROMIUM_DISABLE_SANDBOX` | `false` por defecto; habilitar explícitamente solo si el entorno del contenedor no permite el sandbox de Chromium. |

Los reportes utilizan el sandbox de Chromium por defecto. Algunos proveedores de contenedores impiden los espacios de nombres requeridos; en ellos, `CHROMIUM_DISABLE_SANDBOX=true` permite iniciar Chromium con `--no-sandbox` y `--disable-setuid-sandbox`. Esta opción reduce el aislamiento del navegador y debe limitarse a un entorno controlado que genere los reportes previstos por la aplicación.

## Salud y cierre del proceso

`GET /health` responde si el proceso HTTP está activo. `GET /ready` comprueba que TypeORM está inicializado y puede ejecutar una consulta a SQL Server; devuelve 503 cuando la persistencia no está disponible. Ambos endpoints excluyen credenciales y detalles internos de errores. La comprobación de disponibilidad no certifica que todas las tablas y procedimientos requeridos estén instalados.

La API inicia su servidor HTTP después de conectar con la base. Los reintentos de arranque permiten esperar a que otro contenedor complete su preparación. Ante `SIGTERM` o `SIGINT`, deja de aceptar conexiones y cierra las conexiones de base de datos. El contenedor dispone de un control de salud sobre `/ready`.

## Preparación de SQL Server

El esquema inicial no se crea con TypeORM: `synchronize` permanece desactivado. Los scripts de `src/migrations` complementan una base existente y **no constituyen una instalación completa desde cero**. Es necesario preparar previamente los esquemas, tablas, tipos de tabla, procedimientos y datos de referencia del sistema, y aplicar las migraciones revisadas que correspondan.

El archivo `tests/fixtures/feature-schema.sql` contiene un esquema parcial para pruebas de funcionalidades. No debe utilizarse como sustituto de la base completa de la aplicación. En un despliegue de demostración se debe utilizar una exportación de estructura revisada y datos ficticios, evitando publicar datos comerciales o credenciales existentes.

Respaldar la base y el volumen de archivos de forma coordinada. Las actualizaciones deben conservar una identificación de las imágenes utilizadas y del estado de las migraciones para poder reproducir la versión desplegada.
