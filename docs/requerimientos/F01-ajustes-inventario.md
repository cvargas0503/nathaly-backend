# F01 — Ajustes de inventario por diferencias físicas

**Responsable:** Desarrollador 1. **Rama:** `feature/f01-ajustes-inventario`. **Destino del PR:** `develop`. **Revisor:** Desarrollador 2.

## Feature y necesidad

Como encargado de inventario quiero registrar entradas y salidas por diferencias del conteo físico, con motivo y trazabilidad, para que el stock y el Kardex coincidan con lo encontrado en la bodega. Existen entidades `Ajuste` y `AjusteDetalle`, pero no hay un módulo HTTP dedicado a registrar estos ajustes.

## Requerimiento funcional

Crear `src/modules/ajustes` y publicar estas rutas bajo `/api/v1/ajustes`:

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | `/` | Crea y aplica un ajuste completo; devuelve `201` con cabecera, detalles y stock posterior. |
| GET | `/` | Lista ajustes por bodega y rango de fecha, con `page`, `limit` y total. |
| GET | `/:id` | Consulta un ajuste y sus detalles; devuelve `404` si no existe. |

Ejemplo de entrada de `POST`:

```json
{
  "idBodega": 2,
  "observacion": "Diferencia de conteo físico",
  "detalles": [
    { "idProducto": 15, "tipo": "SALIDA", "cantidad": 2 },
    { "idProducto": 16, "tipo": "ENTRADA", "cantidad": 1 }
  ]
}
```

Reglas obligatorias:

- Permiso propuesto: `REGISTRAR_AJUSTES` para crear y `VER_AJUSTES` para consultar. Agregar seeds idempotentes si estos códigos no existen y documentar cómo un administrador los asigna.
- Bodega y productos deben existir y no estar eliminados. La observación es obligatoria, entre 5 y 250 caracteres; detalles entre 1 y 100, sin repetir producto.
- Cantidad estrictamente positiva, hasta dos decimales. `tipo` acepta solo `ENTRADA` o `SALIDA`. El costo unitario se obtiene del producto y no se acepta desde el cliente.
- Resolver los tipos de movimiento desde el catálogo por un código/nombre documentado, no con IDs numéricos asumidos. Conservar la relación de cada movimiento de Kardex con el ajuste.
- Guardar cabecera, detalles, cambio de existencia y Kardex en una sola transacción. Bloquear la existencia al calcular salidas para que solicitudes simultáneas no generen stock negativo. Bloquear productos en un orden consistente para reducir deadlocks.
- Si una salida excede el stock, rechazar **todo** el ajuste con `409`; no aplicar los demás detalles. Una entrada puede crear una existencia ausente, respetando la clave única bodega/producto; una salida sin existencia se rechaza.
- Persistir creador y fecha desde el contexto autenticado. No ofrecer borrado ni edición de ajustes aplicados: una corrección se registra como otro ajuste con su motivo.
- Paginación predeterminada de 20, máximo 100; orden estable por fecha e ID. Fechas inválidas o rangos invertidos devuelven `400`.

## Entregable esperado

Rutas, controlador, DTO/validadores y servicio transaccional en `src/modules/ajustes`; reutilización de las entidades existentes; migración `002_f01_ajustes.sql` si hacen falta seeds o índices; pruebas; contratos y ejemplos en `docs/features/F01.md`; evidencia en `docs/evidencias/F01.md`. Declarar explícitamente el schema real utilizado por las entidades involucradas.

## Criterios de aceptación

1. Stock 10, entrada 3: stock 13 y un movimiento enlazado al ajuste.
2. Stock 10, salida 4: stock 6 y salida registrada en Kardex.
3. Dos detalles, uno válido y otro con stock insuficiente: `409`, ninguna cabecera, detalle ni cambio de stock confirmado.
4. Dos salidas concurrentes de 7 sobre stock 10: solo una se confirma y el saldo final es 3.
5. Producto duplicado, cantidad negativa, observación vacía o producto eliminado: solicitud rechazada sin escrituras.
6. Sin cookie: `401`; usuario sin permiso: `403`. Listar y consultar debe respetar filtros y paginación.

Entregar pruebas automatizadas de validación y cálculo; demostrar los casos 3 y 4 contra SQL Server, incluyendo el script de datos ficticios y el estado antes/después. La UI y un workflow de aprobación quedan fuera de esta entrega.

## Entrega en Git

Seguir [git-flow.md](../git-flow.md). Ejemplos de commits: `feat(ajustes): register transactional inventory adjustments`, `test(ajustes): cover concurrent stock withdrawals`, `docs(ajustes): document endpoints and QA evidence`. Abrir PR `feature/f01-ajustes-inventario -> develop`; no mezclar directamente a `qa` ni a `master`.
