# F05 — Sugerencias de reposición por bodega y proveedor

**Responsable:** Desarrollador 5. **Rama:** `feature/f05-reposicion-inventario`. **Destino del PR:** `develop`. **Revisor:** Desarrollador 1.

## Feature y necesidad

Como encargado de compras quiero ver qué productos tienen existencia por debajo del mínimo y cuántas unidades conviene comprar para llegar al máximo, agrupados por proveedor, para preparar una compra con cantidades justificadas. El proyecto tiene mínimo, máximo, costo, proveedor y existencias por bodega, pero solo expone alertas de stock, no una propuesta de reposición.

## Requerimiento funcional

Crear `src/modules/reposicion` y publicar:

| Método | Ruta completa | Resultado |
| --- | --- | --- |
| GET | `/api/v1/reposicion?idBodega=2&idProveedor=3&page=1&limit=20` | Propuesta paginada de productos bajo mínimo, cantidades y costo estimado. |
| GET | `/api/v1/reposicion/resumen?idBodega=2` | Resumen completo por proveedor, independiente de la página de detalle. |

Ejemplo de elemento:

```json
{
  "idProducto": 15,
  "codigo": "PROD-015",
  "idBodega": 2,
  "idProveedor": 3,
  "stock": "3.00",
  "minimo": "5.00",
  "maximo": "12.00",
  "cantidadSugerida": "9.00",
  "costoUnitario": "20.0000",
  "costoEstimado": "180.0000",
  "motivo": "STOCK_BAJO"
}
```

Reglas obligatorias:

- Registrar permiso `VER_REPOSICION`. Ambos endpoints requieren sesión y ese permiso. La bodega es obligatoria y debe existir, sin eliminación lógica; el proveedor es filtro opcional.
- Para cada producto activo con existencia activa en esa bodega, incluir solo `stock < existenciaMin` y `existenciaMin > 0`. Si falta una fila de existencia o está eliminada, no asumir stock cero: devolver el número de productos sin existencia en una advertencia/resumen separado, sin proponer compras para ellos.
- Con configuración válida (`maximo >= minimo` y `maximo > 0`), calcular `cantidadSugerida = max(0, maximo - stock)` y `costoEstimado = cantidadSugerida * costo`. El costo viene del producto, no de una cotización ni de un parámetro del cliente.
- No sumar stock de otras bodegas. Stock negativo se muestra como inconsistencia separada y se excluye de la propuesta automática.
- Máximo menor al mínimo, máximo cero o costo negativo: informar `CONFIGURACION_INVALIDA`, sin cantidad sugerida ni costo estimado; no ocultar que hace falta corregir el producto.
- Un proveedor eliminado se informa como `PROVEEDOR_NO_DISPONIBLE`; el producto no se suma a una propuesta comprable. No cambiar automáticamente el proveedor asignado.
- Exponer importes/cantidades como cadenas decimales: dos decimales para cantidades y cuatro para costos. Evitar errores de coma flotante y documentar redondeo. No convertir entre monedas ni afirmar que el costo estimado incluye impuestos.
- Paginación predeterminada 20, máximo 100, orden estable por proveedor, código e ID. El resumen agrupa todas las filas válidas filtradas y entrega total de productos, cantidad y costo estimado; sus totales no se reducen al tamaño de una página.
- Una propuesta es una fotografía al consultar, no una reserva de stock. Incluir fecha de generación UTC. Los dos endpoints son de solo lectura: no crean compras, traslados, movimientos ni existencias.

## Entregable esperado

Módulo de reposición, validadores, servicio de consulta/cálculo, pruebas y documentación de endpoints en `docs/features/F05.md`. `docs/evidencias/F05.md` debe incluir un conjunto ficticio con dos bodegas y dos proveedores. Crear `006_f05_reposicion.sql` únicamente si son necesarios seeds de permisos o índices; no duplicar tablas de producto/proveedor.

## Criterios de aceptación

1. Stock 3, mínimo 5, máximo 12 y costo 20: sugerencia 9, costo estimado 180.
2. Stock igual al mínimo: no se propone compra. Mínimo cero: no se propone compra.
3. Mismo producto con stock 3 en bodega A y 20 en B: consultar A propone 9; consultar B no propone compra.
4. Máximo inválido, stock negativo o proveedor eliminado: diagnóstico explícito, sin incorporar la fila al total comprable.
5. Falta existencia: advertencia separada; no inferir stock cero ni insertar filas.
6. 25 productos válidos, página de 20: resumen de los 25; no duplicar cantidades por un JOIN.
7. Cantidades decimales y costos con cuatro decimales: resultados y redondeo reproducibles.
8. Comparar conteos de tablas antes/después de ambas consultas: no hay escrituras. Sin sesión o permiso: `401` o `403`.

Entregar pruebas de cálculo y validación, y evidencias de filtros/joins/totales contra SQL Server. No se incluyen proveedores alternativos, pronósticos, generación de órdenes ni UI.

## Entrega en Git

Ejemplos: `feat(reposicion): suggest purchases by warehouse and supplier`, `test(reposicion): cover thresholds and invalid stock settings`, `docs(reposicion): document proposal calculations`. Abrir PR `feature/f05-reposicion-inventario -> develop` según [git-flow.md](../git-flow.md).
