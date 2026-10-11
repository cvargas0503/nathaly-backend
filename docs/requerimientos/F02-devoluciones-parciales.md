# F02 — Devoluciones parciales con saldo disponible e idempotencia

**Responsable:** Desarrollador 2. **Rama:** `feature/f02-devoluciones-parciales`. **Destino del PR:** `develop`. **Revisor:** Desarrollador 3.

## Feature y necesidad

Como encargado de ventas quiero consultar qué cantidad de cada línea de una factura aún se puede devolver y registrar devoluciones sucesivas, para evitar reintegrar más unidades de las vendidas. Quiero además que un reintento de red no duplique una nota de crédito ni el stock. El endpoint actual compara cada solicitud con la cantidad vendida, sin descontar devoluciones anteriores ni proteger reintentos mediante una clave.

## Requerimiento funcional

Trabajar en `src/modules/devoluciones` y mantener los endpoints de listado y detalle actuales:

| Método | Ruta completa | Resultado |
| --- | --- | --- |
| GET | `/api/v1/devoluciones/ventas/:idVenta/disponibilidad` | Líneas con `idVentaDetalle`, cantidad vendida, devuelta acumulada y disponible. |
| POST | `/api/v1/devoluciones` | Registra una devolución parcial respetando disponibilidad y clave opcional `Idempotency-Key`. |

Nueva entrada recomendada, con header `Idempotency-Key: devolucion-demo-0001`:

```json
{
  "idVenta": "120",
  "motivo": "Producto devuelto por el cliente",
  "detalles": [{ "idVentaDetalle": "350", "cantidad": 2 }]
}
```

Reglas obligatorias:

- Permiso propuesto: `REGISTRAR_DEVOLUCIONES` para POST y `VER_DEVOLUCIONES` para disponibilidad. Aplicar autenticación y autorización también a los endpoints existentes del módulo.
- `disponible = vendida - suma(cantidades de notas de crédito no eliminadas)`. No inventar un filtro de estado que excluya notas actualmente válidas; documentar el significado de los estados reales en la base de pruebas.
- La línea debe pertenecer a la venta. No aceptar IDs repetidos en el body ni cantidades no finitas, no positivas o con más de dos decimales. Validar el motivo y su límite de 250 caracteres.
- Conservar compatibilidad con el body anterior `{ idProducto, cantidad }`: resolver la línea solamente si ese producto aparece en una única línea activa de la venta; si hay ambigüedad, responder `409` y pedir `idVentaDetalle`.
- Calcular disponibilidad y registrar la nota dentro de la misma transacción, con bloqueo que serialice las devoluciones de la venta. Dos solicitudes simultáneas no pueden devolver las mismas unidades restantes.
- No alterar el criterio monetario ni la liquidación de caja en este alcance: conservar el cálculo actual de monto por cantidad y precio unitario y documentarlo como limitación. Un cambio fiscal o de prorrateo de descuentos necesita un requerimiento separado. La garantía de esta feature se refiere a unidades, duplicidad y consistencia del stock.
- Con clave, persistir en la misma transacción usuario, clave, hash canónico del body y resultado. El hash normaliza orden de propiedades y detalles. Crear una restricción única sobre usuario/clave.
- Una clave ya confirmada con el mismo body devuelve `200`, la misma nota y `replayed: true`; no modifica stock, consecutivos ni Kardex. Misma clave con body distinto devuelve `409`. Un primer registro devuelve `201`. Una clave no debe quedar marcada como exitosa si la transacción hace rollback.
- La clave es opcional para no romper el frontend actual; las solicitudes sin clave conservan creación normal y no tienen garantía de deduplicación por reintento. La protección de cantidades acumuladas aplica siempre.
- Guardar stock, Kardex, nota, detalles, consecutivo y resultado de idempotencia de forma atómica. No atribuir operaciones a usuario 1 como fallback.

## Entregable esperado

Endpoint de disponibilidad, servicio de devolución con validación acumulada, persistencia de idempotencia y migración `003_f02_devoluciones.sql`; pruebas automatizadas de compatibilidad y reintentos; documentación de contratos/códigos HTTP en `docs/features/F02.md`; evidencia en `docs/evidencias/F02.md`. Migración con índice único y estrategia de reversión en una BD de pruebas.

## Criterios de aceptación

1. Venta de 10, devolución anterior de 3: disponibilidad 7. Devolver 4 deja disponibilidad 3.
2. Intentar devolver 8 en ese escenario: `409` sin cambios en stock ni nota.
3. Repetir dos veces clave/body: una sola nota y un solo incremento de stock; segunda respuesta `200` con el mismo ID.
4. Reutilizar clave con otra cantidad: `409`. Distintos usuarios no comparten resultados de una clave.
5. Dos devoluciones concurrentes de 5 cuando quedan 7: solo una se confirma.
6. Venta con producto repetido en distintas líneas: rechazar el formato ambiguo; aceptar una línea explícita válida.
7. Simular fallo al escribir Kardex: rollback completo, incluidos consecutivo e idempotencia. El reintento posterior puede confirmar normalmente.
8. Cliente anterior sin header ni `idVentaDetalle`: sigue funcionando para una venta no ambigua. Sin sesión y sin permiso: `401` y `403`.

Demostrar los casos de concurrencia, rollback y restricción única contra SQL Server; entregar fixture y pasos reproducibles. Cambios al frontend, autorización de notas y reintegros monetarios quedan fuera de esta entrega.

## Entrega en Git

Ejemplos: `feat(devoluciones): expose remaining return quantities`, `feat(devoluciones): persist idempotent credit notes`, `test(devoluciones): cover retries and concurrent returns`. Abrir PR `feature/f02-devoluciones-parciales -> develop` según [git-flow.md](../git-flow.md).
