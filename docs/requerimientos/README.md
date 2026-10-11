# Asignación de cinco features de backend

Fecha: 11 de octubre de 2026. Repositorio: https://github.com/cvargas0503/nathaly-backend.

Estos documentos son requerimientos para implementar; las cinco features todavía no están desarrolladas. Los responsables se identifican como Desarrollador 1 a 5 hasta que el coordinador asigne nombres. Cada persona desarrolla una feature y revisa el PR de la siguiente persona; el Desarrollador 5 revisa al 1. Nadie aprueba su propio trabajo.

| Responsable | Requerimiento | Issue | Rama asignada | Revisor |
| --- | --- | --- | --- | --- |
| Desarrollador 1 | [F01: Ajustes de inventario](F01-ajustes-inventario.md) | [#3](https://github.com/cvargas0503/nathaly-backend/issues/3) | `feature/f01-ajustes-inventario` | Desarrollador 2 |
| Desarrollador 2 | [F02: Devoluciones parciales e idempotentes](F02-devoluciones-parciales.md) | [#4](https://github.com/cvargas0503/nathaly-backend/issues/4) | `feature/f02-devoluciones-parciales` | Desarrollador 3 |
| Desarrollador 3 | [F03: Notificaciones por usuario](F03-notificaciones-usuario.md) | [#5](https://github.com/cvargas0503/nathaly-backend/issues/5) | `feature/f03-notificaciones-usuario` | Desarrollador 4 |
| Desarrollador 4 | [F04: Auditoría de catálogos](F04-auditoria-catalogos.md) | [#6](https://github.com/cvargas0503/nathaly-backend/issues/6) | `feature/f04-auditoria-catalogos` | Desarrollador 5 |
| Desarrollador 5 | [F05: Sugerencias de reposición](F05-reposicion-inventario.md) | [#7](https://github.com/cvargas0503/nathaly-backend/issues/7) | `feature/f05-reposicion-inventario` | Desarrollador 1 |

## Reglas compartidas y entregable de cada persona

1. Implementar exclusivamente el requerimiento asignado. Mantener compatibilidad con los clientes actuales; documentar cualquier cambio de contrato y acordarlo antes de mezclar.
2. Separar rutas, controlador, validación y lógica de negocio. Usar SQL parametrizado (`src/utils/sql.ts`) o parámetros de TypeORM. No crear tablas desde un controlador y mantener `synchronize=false`.
3. Autenticar todos los endpoints con `authMiddleware`. La autorización de una operación se valida también en backend: comprobar `UsuarioPermiso`, `Permiso.activo`, `permitido` y los indicadores de eliminación. El usuario de auditoría viene de `req.user`, nunca del body. Un permiso inexistente se deniega; los seeds de permisos no deben otorgarlo automáticamente a todos los usuarios. Mantener las comprobaciones en archivos del módulo propio para evitar conflictos en un middleware compartido.
4. Validar tipos, longitudes y números completos; rechazar valores como `"3abc"`, NaN, infinitos, fechas inexistentes e IDs inválidos. Los IDs bigint se exponen como cadenas. Las operaciones financieras y de stock necesitan precisión decimal, transacciones y pruebas de concurrencia cuando corresponda.
5. Responder `400` ante formato inválido, `401` sin sesión, `403` sin permiso, `404` si no existe el recurso, `409` ante conflicto de negocio y `500` ante error interno. No devolver secretos ni mensajes internos de SQL Server.
6. Entregar implementación, pruebas, documentación de endpoints y evidencias en `docs/evidencias/F0N.md`. Incluir casos ejecutados, resultados, commit probado y limitaciones. Usar datos ficticios; no versionar cookies, tokens, `.env`, credenciales, imágenes de usuarios ni respaldos de BD.
7. Ejecutar `npm run typecheck`, `npm test` y `npm run build`. Las pruebas actuales usan `node:test`; agregar pruebas ejecutables mediante `npm test`. Para integración SQL Server, entregar además un comando reproducible y un fixture con preparación y limpieza en una base de pruebas; no afirmar que el CI existente prueba la BD porque actualmente no aprovisiona SQL Server.
8. Documentar los escenarios de integración no ejecutados. Un mock no acredita rollback real, aislamiento entre usuarios ni bloqueo entre transacciones: esos escenarios necesitan evidencia contra SQL Server en QA.
9. Subir commits pequeños con Conventional Commits a la rama feature y abrir un PR hacia `develop`, usando [el flujo de Git](../git-flow.md). Una feature se considera entregada cuando el PR tiene revisión ajena, checks aprobados, documentación y evidencias; se considera liberada cuando supera QA y llega a `master`.

## Coordinación para trabajar en paralelo

Cada feature tiene su propio módulo o zona de escritura. `src/app.ts` es compartido: agregar solamente el import y el registro de la ruta propios, sin ordenar ni reformatear rutas de otros módulos. Si hay conflicto, conservar ambas rutas y volver a validar. Los cambios globales de dependencias, `package-lock.json`, autenticación o configuración requieren coordinación con el integrador.

Reservar migraciones nuevas con estos nombres: `002_f01_ajustes.sql`, `003_f02_devoluciones.sql`, `004_f03_notificaciones.sql`, `005_f04_auditoria.sql`, `006_f05_reposicion.sql`. Crear solamente las que realmente se necesiten. Los números identifican la feature; no representan dependencias entre features. El integrador aplica los scripts presentes en orden y mantiene un registro por ambiente, ya que actualmente no hay un runner automático. No editar `001_nuevas_funcionalidades.sql`, porque ya puede estar aplicada.

Reutilizar entidades existentes y contrastar los esquemas con la BD de pruebas: algunas entidades heredadas no declaran un schema explícito. No asumir que una entidad sin schema apunta a `INVENTARIO` o `VENTAS`. Resolver únicamente el mapeo necesario para la feature propia y documentarlo. Un cambio de esquema debe incluir migración, procedimiento de reversión y efecto sobre datos existentes; las reversas destructivas se ejecutan solo en la base de pruebas.

El coordinador administra accesos al repositorio privado, asigna permisos de aplicación en la BD de pruebas, revisa contratos compartidos y realiza promociones `develop -> qa -> master`. Cada desarrollador recibe únicamente configuración local y datos de prueba por un medio privado.
