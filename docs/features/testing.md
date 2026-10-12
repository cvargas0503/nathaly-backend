# Pruebas reproducibles de features

Node >=22.15, npm ci. `npm test` compila y ejecuta validadores/cálculos y regresiones; `npm run typecheck` valida TypeScript. `npm run test:features` ejecuta las features presentes en la rama contra SQL Server. No sustituye el test:integration anterior de facturación/seguridad, que usa otro fixture.

Para SQL auth, suministrar DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=master, JWT_SECRET y opciones TLS en entorno privado. El usuario de QA debe poder crear y eliminar **bases temporales**. Los tests crean un nombre aleatorio CODEX_NATHALY_QA_<uuid>, cargan tests/fixtures/feature-schema.sql, migraciones y datos ficticios; el hook final elimina únicamente la base creada por ese proceso, validando el nombre exacto. Nunca usan una base existente de negocio como destino de escritura. No incluir credenciales en Git.

Alternativa Windows integrada usada en esta ejecución: instalar msnodesqlv8 en un directorio temporal fuera del repo y definir QA_NATIVE_MODULE_DIR con su node_modules; QA_SQL_SERVER con la instancia local. Requiere ODBC Driver 17 y `UV_THREADPOOL_SIZE=32` **antes** de iniciar Node. Las consultas bloqueantes ODBC necesitan suficientes hilos para diez competidores; cuatro hilos agotan el executor mientras esperan el lock. Esto solo afecta al driver de QA: el backend conserva tedious/mssql habitual. El test fija un pool de 20 conexiones para esta carga.

El fixture reproduce columnas/tipos de las tablas locales relevantes y los contratos esperados por la API. No copia filas reales, ni FKs hacia módulos externos, ni todos los CHECK del sistema. Añade Permiso.Codigo, que el código de develop ya requiere pero falta en el esquema local antiguo inspeccionado. Los contratos de catálogos/estados en el despliegue deben comprobarse por separado. No presentar estas pruebas como certificación de una copia completa de producción.

Las migraciones de feature se aplican dos veces para comprobar idempotencia. Los casos de rollback usan triggers de fallo únicamente en cada base temporal y los quitan después; limpieza final elimina la base. Los IDs 1/2 del fixture representan usuarios y bodegas ficticios; ninguna solicitud HTTP usa fallback de usuario.

No mezclar automáticamente ni cerrar issues hasta revisión de PR y aceptación del integrador. Promoción QA/master sigue docs/git-flow.md.
