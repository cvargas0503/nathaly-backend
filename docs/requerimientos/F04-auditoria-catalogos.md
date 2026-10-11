# F04 — Auditoría real de cambios en catálogos

**Responsable:** Desarrollador 4. **Rama:** `feature/f04-auditoria-catalogos`. **Destino del PR:** `develop`. **Revisor:** Desarrollador 5.

## Feature y necesidad

Como administrador quiero consultar quién creó, modificó o eliminó una categoría, marca o línea y sus valores anteriores y nuevos, para investigar cambios concretos. Existe la tabla `ADMIN.Auditoria` y un endpoint de lectura, pero la reconstrucción a partir de columnas de última modificación no conserva todos los eventos históricos.

## Requerimiento funcional

Implementar un servicio reutilizable en `src/modules/auditoria/services` e integrarlo **solo** en los módulos `catalogos/Categoria`, `catalogos/Marca` y `catalogos/Linea`. Ampliar el contrato de `GET /api/v1/auditoria` con filtros `entidad`, `accion`, `usuarioId`, `desde`, `hasta`, `page`, `limit` e `incluirDatos`.

Reglas obligatorias:

- Registrar `VER_AUDITORIA_CATALOGOS` para la consulta de estos eventos. Conservar los permisos de gestión de cada catálogo y verificarlos en backend al modificarlo; no basta ocultar opciones en la UI.
- Registrar un evento por entidad afectada: `CREAR`, `MODIFICAR` o `ELIMINAR`, con entidad canónica `categorias`, `marcas` o `lineas`, ID, usuario de sesión, fecha UTC y descripción.
- Guardar snapshots JSON de campos permitidos. En creación: anterior NULL; en modificación: anterior y nuevo; en eliminación lógica: conservar valores y reflejar `eliminado` y metadatos correspondientes. Nunca registrar cookies, tokens, claves, encabezados completos ni el request entero.
- Cambio de catálogo y escritura de auditoría usan el mismo `EntityManager` y la misma transacción. Si no se puede guardar la auditoría, el cambio hace rollback. No usar repositorios externos a la transacción para la segunda escritura.
- Una modificación sin diferencias reales no agrega un evento. Una eliminación masiva genera un evento por registro que cambia de estado; una entidad ya eliminada no genera un segundo evento ficticio.
- Los eventos son append-only: no publicar endpoints para editar o borrar auditoría. No fabricar eventos históricos antes de la fecha en que se activa esta feature.
- La consulta es paginada, máximo 100, orden estable por fecha e ID. `incluirDatos=false` por defecto; `true` incluye snapshots para usuarios autorizados.
- Los filtros son parametrizados y se combinan, con fechas UTC ISO 8601 y rango válido. Si hay eventos reales de estos catálogos, la lectura no debe sustituirlos silenciosamente por una reconstrucción. Un error de BD devuelve error, no una lista histórica inventada.
- Mantener los demás contratos de catálogo y auditoría. Si se conserva una reconstrucción heredada para otras entidades, identificarla explícitamente como `fuente: "reconstruida"`; los eventos registrados se identifican como `fuente: "persistida"`.
- Puede agregarse un índice por entidad/fecha e ID con `005_f04_auditoria.sql`. No se requiere que los demás desarrolladores llamen a este servicio en este sprint.

## Entregable esperado

Servicio de auditoría transaccional, integración de los tres catálogos, filtros/paginación/snapshots, pruebas y migración si corresponde. Entregar `docs/features/F04.md`, lista explícita de campos auditados y excluidos, y `docs/evidencias/F04.md` con ejemplos de eventos encadenados. Eliminar logs del request completo en los handlers intervenidos.

## Criterios de aceptación

1. Crear categoría, cambiar nombre dos veces y eliminarla: cuatro eventos diferentes en orden, con snapshots que enlazan cada estado.
2. Repetir una actualización sin cambiar valores: no aumenta el número de eventos.
3. Eliminar tres marcas activas en un lote: tres eventos, y ningún evento para una marca ya eliminada.
4. Simular fallo de auditoría: el catálogo conserva su estado anterior.
5. Usuario sin permiso de consulta: `403`; sin sesión: `401`. Los snapshots no contienen secretos.
6. Consultar filtros de entidad/usuario/fecha con dos páginas: sin duplicar u omitir registros por empates de fecha.
7. Un catálogo conserva su respuesta HTTP anterior; los clientes actuales siguen funcionando.

Demostrar la atomicidad contra SQL Server; incluir fixture y procedimiento de limpieza únicamente para la base de pruebas. Auditoría de inventario, ventas y usuarios queda fuera del alcance.

## Entrega en Git

Ejemplos: `feat(auditoria): record transactional catalog events`, `feat(auditoria): expose paginated event snapshots`, `test(auditoria): verify rollback and event chronology`. Abrir PR `feature/f04-auditoria-catalogos -> develop` según [git-flow.md](../git-flow.md).
