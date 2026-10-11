# F03 — Notificaciones persistentes y lectura por usuario

**Responsable:** Desarrollador 3. **Rama:** `feature/f03-notificaciones-usuario`. **Destino del PR:** `develop`. **Revisor:** Desarrollador 4.

## Feature y necesidad

Como usuario quiero que las alertas que marqué como leídas sigan leídas cuando recargo la aplicación, sin modificar el estado de otros usuarios. Actualmente las alertas dinámicas vuelven siempre como no leídas; marcar una como leída puede responder éxito aunque no se haya persistido. El filtro global usa `undefined` donde debería verificar explícitamente NULL.

## Requerimiento funcional

Trabajar únicamente en `src/modules/notificaciones`, sus entidades y su migración:

| Método | Ruta completa | Resultado |
| --- | --- | --- |
| GET | `/api/v1/notificaciones?page=1&limit=20&leida=false&tipo=stock_bajo` | Lista del usuario y alertas globales, estado de lectura individual, paginación y `noLeidas`. |
| PATCH | `/api/v1/notificaciones/:id/leer` | Persiste lectura solo para el usuario autenticado; segunda llamada es idempotente. |

Reglas obligatorias:

- Registrar permiso `VER_NOTIFICACIONES`; listar y leer requieren ese permiso. El ID de usuario se obtiene de la sesión y no se acepta en parámetros para actuar por otra persona.
- Una notificación privada es visible solo a su destinatario. Las globales (`UsuarioId IS NULL`) son visibles a todos los usuarios autorizados y cada uno tiene su propio estado de lectura. No usar `undefined` como filtro de NULL en TypeORM.
- No utilizar el campo compartido `Notificacion.Leida` como único estado de lectura para mensajes globales. Crear una relación `NotificacionLectura` con clave única notificación/usuario y fecha de lectura; migrar el estado previo de notificaciones privadas sin asignar globalmente lecturas antiguas de destinatario desconocido.
- Dar a las alertas dinámicas una identidad estable persistida. Para stock, incluir **producto y bodega** en la clave; para pago, usar la venta. `stock-15` no distingue dos bodegas.
- Reconciliar alertas durante GET dentro del módulo propio: generar una sola alerta activa por tipo/entidad/bodega y cerrar la condición cuando deja de existir. GET puede materializar internamente esa proyección de alertas, pero no modifica operaciones de stock o ventas. Documentar este comportamiento y usar transacciones/índices únicos contra llamadas concurrentes.
- Si una condición se resuelve y luego vuelve a aparecer, generar un nuevo episodio de alerta, inicialmente no leído. Un GET repetido mientras la condición sigue activa no genera otro episodio ni cambia su fecha original.
- Preservar los campos públicos actuales `id`, `tipo`, `titulo`, `descripcion`, `entidad`, `entidadId`, `leida`, `fecha`, `data` y `noLeidas`. Las nuevas alertas persistidas usan ID bigint como cadena. La API debe resolver los IDs dinámicos antiguos durante la transición o documentar y probar una estrategia compatible de actualización del cliente.
- `noLeidas` cuenta todas las alertas visibles activas no leídas, independientemente de la página o filtros. `pagination.total` sí corresponde al filtro seleccionado. Validar `leida`, tipo y paginación; máximo 100 elementos por página.
- Si la notificación no existe o pertenece a otra persona, devolver `404` sin revelar su existencia. Un fallo de persistencia no puede responder que la lectura fue exitosa.

## Entregable esperado

Servicio de reconciliación, listado y lectura; entidad de lectura individual y estado/identidad de episodios; migración `004_f03_notificaciones.sql` con índices; pruebas; documentación en `docs/features/F03.md`; evidencia en `docs/evidencias/F03.md`. No cambiar controladores de ventas, productos ni las otras features para producir alertas.

## Criterios de aceptación

1. Usuario A marca una global como leída: persiste tras recargar; usuario B la sigue viendo no leída.
2. Usuario A intenta leer una privada de B: `404`; no se altera el estado de B.
3. Diez GET concurrentes para la misma condición: un solo episodio persistido.
4. Un producto con stock bajo en dos bodegas: dos alertas distintas.
5. La condición se resuelve y vuelve: se crea un episodio nuevo no leído, sin reactivar ni borrar la evidencia anterior.
6. 25 no leídas y página de 20: `noLeidas=25`; paginación y total son consistentes.
7. Dos PATCH de lectura: una sola relación usuario/notificación y ambas respuestas exitosas.
8. BD no disponible durante PATCH: error interno, nunca éxito ficticio. Sin sesión o permiso: `401` o `403`.

Comprobar privacidad, persistencia y concurrencia contra SQL Server. No se incluyen correo, SMS, WebSockets ni tareas programadas.

## Entrega en Git

Ejemplos: `feat(notificaciones): persist user-specific reading state`, `feat(notificaciones): reconcile stable alert episodes`, `test(notificaciones): verify private notification isolation`. Abrir PR `feature/f03-notificaciones-usuario -> develop` según [git-flow.md](../git-flow.md).
