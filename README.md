# API Tiendas Nathaly

Backend de inventario, ventas, compras, caja y seguridad construido con Express, TypeScript, TypeORM y SQL Server.

## Desarrollo

Requisitos: Node.js 22.15 o superior, npm y una base SQL Server con el esquema del sistema existente.

1. Ejecutar `npm ci`.
2. Copiar `.env.example` a `.env` y completar `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `JWT_SECRET`.
3. Generar una clave JWT con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
4. Aplicar `src/migrations/001_nuevas_funcionalidades.sql` con SSMS o sqlcmd sobre la base existente. Esta migración agrega tablas; no crea el esquema inicial.
5. Ejecutar `npm run dev`.

Las variables suministradas por el entorno tienen prioridad sobre `.env`. La API valida los valores al iniciar y no usa credenciales predeterminadas. `DB_ENCRYPT=true` y `DB_TRUST_SERVER_CERTIFICATE=false` son los valores recomendados para producción. En una instalación local con un certificado autofirmado, configurar explícitamente las opciones necesarias. `CORS_ORIGINS` admite una lista de orígenes separados por comas.

## Validación y producción

- `npm run typecheck`: validación de TypeScript.
- `npm test`: compilación y pruebas de composición de consultas SQL.
- `npm run build` y `npm start`: compilación y ejecución del servidor.

Configurar `NODE_ENV=production`, una clave JWT privada, TLS y `CORS_ORIGINS` con el origen del frontend. Las cookies de autenticación usan `Secure` en producción.

`UPLOADS_DIR` define el directorio persistente de imágenes; por defecto es `src/uploads`, tanto en desarrollo como al ejecutar el código compilado. Los archivos subidos, `.env`, respaldos SQL y `dist` quedan fuera de Git. Respaldar el directorio de imágenes junto con la base de datos.

Las modificaciones de esquema se realizan mediante migraciones revisadas, con `synchronize=false`. El endpoint de tasa de cambio requiere que la migración haya sido aplicada y guarda los cambios en una transacción.

Consultar [los endpoints](docs/api-endpoints.md). Las pruebas automatizadas no sustituyen las pruebas de integración contra una base SQL Server preparada.

## Trabajo en equipo

Consultar [la asignación de cinco features](docs/requerimientos/README.md), con requerimientos, entregables y criterios de aceptación para cada desarrollador. Las tareas están especificadas y pendientes de implementación.

El flujo de contribución es `feature/* -> develop -> qa -> master`. Cada persona trabaja en su rama feature, sube commits con Conventional Commits y abre un PR hacia `develop`; el integrador promueve a QA y después a master con revisión y evidencia. Seguir [la guía de Git Flow y los comandos de clonación/entrega](docs/git-flow.md), [el checklist de QA](docs/qa-checklist.md) y [el checklist de liberación](docs/release-checklist.md). `main` se conserva como referencia anterior.
