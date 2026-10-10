# 📋 Documentación de Nuevos Endpoints - API Tiendas Nathaly

> [!IMPORTANT]
> Antes de usar estos endpoints, ejecuta la migración SQL para crear las tablas necesarias:
> [001_nuevas_funcionalidades.sql](../src/migrations/001_nuevas_funcionalidades.sql)

**Base URL:** `http://localhost:3000/api/v1`
**Autenticación:** Todos los endpoints requieren cookie `token` (JWT). Primero hacer login via `POST /api/v1/auth/login`.

---

## 1. 📊 Dashboard Dinámico

### `GET /dashboard/resumen`

Retorna KPIs principales y datos para gráfico semanal.

**Response:**
```json
{
  "success": true,
  "data": {
    "ventasMes": 45230.50,
    "productosActivos": 128,
    "clientesRegistrados": 45,
    "saldoCaja": 12500.00,
    "ventasSemana": [
      { "dia": "2026-05-10", "total": 5200.00 },
      { "dia": "2026-05-11", "total": 3800.00 },
      ...
    ]
  }
}
```

### `GET /dashboard/actividad-reciente`

Últimas 10 operaciones del sistema.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tipo": "venta",
      "descripcion": "Nueva venta FAC-00000123 por C$ 1500.00",
      "usuario": "admin",
      "fecha": "2026-05-16T14:30:00"
    }
  ]
}
```

---

## 2. 📈 Reportes y Exportación

### `GET /reportes/ventas?desde={fecha}&hasta={fecha}&idSucursal={id}`

Reporte de ventas con filtros por rango de fechas y sucursal.

| Parámetro | Tipo | Requerido | Ejemplo |
|-----------|------|-----------|---------|
| `desde` | string (YYYY-MM-DD) | ✅ | `2026-05-01` |
| `hasta` | string (YYYY-MM-DD) | ✅ | `2026-05-16` |
| `idSucursal` | number | ❌ | `1` |

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalFacturas": 25,
      "subtotal": 50000.00,
      "descuento": 500.00,
      "impuestos": 0,
      "total": 49500.00
    },
    "detalle": [
      {
        "idVenta": 1,
        "numeroVenta": "FAC-00000001",
        "fecha": "2026-05-01",
        "subtotal": 2000.00,
        "descuento": 0,
        "total": 2000.00,
        "cliente": "Juan Pérez",
        "empleado": "María López",
        "sucursal": "Sucursal Central",
        "estado": "Pagada"
      }
    ]
  }
}
```

### `GET /reportes/ventas/exportar?formato=pdf&desde={fecha}&hasta={fecha}`

Descarga PDF del reporte de ventas.

| Parámetro | Tipo | Requerido | Valores |
|-----------|------|-----------|---------|
| `formato` | string | ❌ | `pdf` (default: html) |
| `desde` | string | ✅ | `2026-05-01` |
| `hasta` | string | ✅ | `2026-05-16` |

**Response:** Archivo PDF o HTML.

### `GET /reportes/compras?desde={fecha}&hasta={fecha}`

Reporte de compras con filtros.

| Parámetro | Tipo | Requerido |
|-----------|------|-----------|
| `desde` | string | ✅ |
| `hasta` | string | ✅ |

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": { "totalCompras": 10, "montoTotal": 35000.00 },
    "detalle": [...]
  }
}
```

### `GET /reportes/inventario/valorizado`

Inventario valorizado por sucursal. Sin parámetros.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValorizado": 250000.00,
    "detalle": [
      {
        "idSucursal": 1,
        "sucursal": "Sucursal Central",
        "bodega": "Bodega Principal",
        "codigoProducto": "PROD-001",
        "producto": "Camiseta Nike",
        "stock": 50,
        "costo": 250.00,
        "valorTotal": 12500.00
      }
    ]
  }
}
```

### `GET /reportes/caja/cierre-diario?fecha={fecha}&idSucursal={id}`

Resumen de cierre de caja del día.

| Parámetro | Tipo | Requerido |
|-----------|------|-----------|
| `fecha` | string | ✅ |
| `idSucursal` | number | ❌ |

**Response:**
```json
{
  "success": true,
  "data": {
    "fecha": "2026-05-16",
    "movimientos": {
      "ingresoNio": 15000.00,
      "ingresoUsd": 200.00,
      "egresoNio": 3000.00,
      "egresoUsd": 0,
      "totalMovimientos": 12
    },
    "ventas": { "totalVentas": 8, "montoVentas": 12500.00 }
  }
}
```

---

## 3. 💱 Gestión de Tasa de Cambio

### `GET /configuracion/tasa-cambio`

Retorna la tasa de cambio actual USD→NIO.

**Response:**
```json
{
  "success": true,
  "data": {
    "idTasa": 1,
    "valor": 37.00,
    "fechaVigencia": "2026-05-16T14:00:00"
  }
}
```

### `PUT /configuracion/tasa-cambio`

Actualiza la tasa de cambio. Desactiva la anterior automáticamente.

**Body:**
```json
{ "valor": 36.85 }
```

**Response:**
```json
{
  "success": true,
  "message": "Tasa de cambio actualizada correctamente",
  "data": {
    "idTasa": 2,
    "valor": 36.85,
    "fechaVigencia": "2026-05-16T14:30:00"
  }
}
```

---

## 4. 🔒 Cierre de Arqueo

### `PATCH /arqueos/{id}/cerrar`

Cierra el arqueo, calcula diferencias automáticamente entre lo esperado y lo contado.

| Parámetro | Tipo | Ubicación |
|-----------|------|-----------|
| `id` | number | URL param |

**Response:**
```json
{
  "success": true,
  "message": "Arqueo cerrado exitosamente.",
  "data": {
    "idArqueo": "5",
    "fechaCierre": "2026-05-16T18:00:00",
    "resumen": {
      "aperturaCordoba": 5000.00,
      "aperturaDolar": 100.00,
      "cierreCordoba": 18500.00,
      "cierreDolar": 350.00,
      "ingresosNio": 13200.00,
      "ingresosUsd": 250.00,
      "esperadoNio": 18200.00,
      "esperadoUsd": 350.00,
      "diferenciaNio": 300.00,
      "diferenciaUsd": 0
    }
  }
}
```

---

## 5. 🔍 Búsqueda Global

### `GET /busqueda?q={termino}`

Busca en productos, clientes, facturas y pedidos. Mínimo 2 caracteres.

| Parámetro | Tipo | Requerido | Ejemplo |
|-----------|------|-----------|---------|
| `q` | string | ✅ | `nike` |

**Response:**
```json
{
  "success": true,
  "data": {
    "productos": [
      { "id": 1, "codigo": "PROD-001", "descripcion": "Camiseta Nike", "costo": 250 }
    ],
    "clientes": [
      { "id": 1, "codigo": "CLI-001", "nombre": "Juan Pérez", "cedula": "001-123456-0001A" }
    ],
    "facturas": [
      { "id": 1, "numero": "FAC-00000001", "fecha": "...", "total": 2000, "cliente": "Juan", "estado": "Pagada" }
    ],
    "pedidos": [
      { "id": 1, "numero": "PED-00000001", "fecha": "...", "total": 1500, "cliente": "María" }
    ],
    "totalResultados": 4
  }
}
```

---

## 6. 🔔 Notificaciones del Sistema

### `GET /notificaciones`

Lista notificaciones del usuario (stock bajo, pagos pendientes). Combina notificaciones almacenadas y generadas dinámicamente.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stock-15",
      "tipo": "stock_bajo",
      "titulo": "Stock bajo: Camiseta Nike",
      "descripcion": "El producto PROD-001 tiene 2 unidades en Bodega Principal (mínimo: 5)",
      "entidad": "producto",
      "entidadId": 15,
      "leida": false,
      "fecha": "2026-05-16"
    },
    {
      "id": "pago-42",
      "tipo": "pago_pendiente",
      "titulo": "Pago pendiente: FAC-00000042",
      "descripcion": "Factura FAC-00000042 de Juan Pérez por C$ 3500.00",
      "entidad": "venta",
      "entidadId": 42,
      "leida": false,
      "fecha": "2026-05-14"
    }
  ],
  "noLeidas": 2
}
```

### `PATCH /notificaciones/{id}/leer`

Marca una notificación como leída.

**Response:**
```json
{ "success": true, "message": "Notificación marcada como leída" }
```

### `GET /notificaciones/alertas-stock?umbral={min}`

Productos con stock por debajo del umbral especificado.

| Parámetro | Tipo | Requerido | Default |
|-----------|------|-----------|---------|
| `umbral` | number | ❌ | Usa `ExistenciaMin` del producto |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "idProducto": 15,
      "codigo": "PROD-001",
      "descripcion": "Camiseta Nike",
      "stock": 2,
      "existenciaMin": 5,
      "existenciaMax": 50,
      "costo": 250,
      "bodega": "Bodega Principal",
      "sucursal": "Sucursal Central"
    }
  ],
  "total": 1
}
```

---

## 7. ↩️ Devoluciones / Notas de Crédito

### `POST /devoluciones`

Registra una devolución asociada a una venta. Automáticamente:
- Crea Nota de Crédito con consecutivo
- Devuelve stock al inventario
- Registra movimiento en Kardex

**Body:**
```json
{
  "idVenta": 42,
  "motivo": "Producto defectuoso",
  "detalles": [
    { "idProducto": 15, "cantidad": 2 },
    { "idProducto": 20, "cantidad": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Devolución registrada correctamente",
  "data": {
    "idNotaCredito": 1,
    "numeroNC": "NC-00000001",
    "totalDevolucion": 750.00,
    "detalles": [
      {
        "idVentaDetalle": 55,
        "idProducto": 15,
        "cantidad": 2,
        "monto": 500.00,
        "precioUnitario": 250.00
      }
    ]
  }
}
```

### `GET /devoluciones?desde={fecha}&hasta={fecha}`

Lista devoluciones con filtros opcionales.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "idNotaCredito": 1,
      "numeroNc": "NC-00000001",
      "fecha": "2026-05-16",
      "total": 750.00,
      "motivo": "Producto defectuoso",
      "numeroVenta": "FAC-00000042",
      "cliente": "Juan Pérez",
      "creadoPorUsuario": "admin"
    }
  ]
}
```

### `GET /devoluciones/{id}`

Detalle completo de una devolución.

**Response:**
```json
{
  "success": true,
  "data": {
    "idNotaCredito": 1,
    "numeroNc": "NC-00000001",
    "fecha": "2026-05-16",
    "total": 750.00,
    "motivo": "Producto defectuoso",
    "numeroVenta": "FAC-00000042",
    "cliente": "Juan Pérez",
    "detalles": [
      {
        "idNotaDetalle": 1,
        "cantidad": 2,
        "monto": 500.00,
        "codigoProducto": "PROD-001",
        "producto": "Camiseta Nike",
        "precioUnitario": 250.00
      }
    ]
  }
}
```

---

## 8. 📝 Auditoría / Historial de Cambios

### `GET /auditoria?entidad={tipo}&desde={fecha}&hasta={fecha}`

Historial de acciones filtrable por entidad y fechas.

| Parámetro | Tipo | Requerido | Valores |
|-----------|------|-----------|---------|
| `entidad` | string | ❌ | `ventas`, `productos`, `usuarios`, `caja` |
| `desde` | string | ❌ | `2026-05-01` |
| `hasta` | string | ❌ | `2026-05-16` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "entidad": "ventas",
      "accion": "CREAR",
      "entidadId": "42",
      "descripcion": "Venta FAC-00000042",
      "usuarioId": 1,
      "usuarioLogin": "admin",
      "fecha": "2026-05-16T14:30:00"
    },
    {
      "entidad": "productos",
      "accion": "MODIFICAR",
      "entidadId": "15",
      "descripcion": "Producto PROD-001 - Camiseta Nike",
      "usuarioId": 1,
      "usuarioLogin": "admin",
      "fecha": "2026-05-16T10:00:00"
    }
  ]
}
```

> [!NOTE]
> Si la tabla `ADMIN.Auditoria` no existe, el sistema genera auditoría dinámica a partir de las columnas `CreadoPor`, `ModificadoPor`, `EliminadoPor` de las tablas existentes.

---

## 📁 Archivos Creados

| Módulo | Controller | Routes |
|--------|-----------|--------|
| Dashboard | [dashboard.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/dashboard/dashboard.controller.ts) | [dashboard.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/dashboard/dashboard.routes.ts) |
| Reportes | [reportes.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/reportes/reportes.controller.ts) | [reportes.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/reportes/reportes.routes.ts) |
| Configuración | [configuracion.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/configuracion/configuracion.controller.ts) | [configuracion.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/configuracion/configuracion.routes.ts) |
| Búsqueda | [busqueda.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/busqueda/busqueda.controller.ts) | [busqueda.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/busqueda/busqueda.routes.ts) |
| Notificaciones | [notificaciones.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/notificaciones/notificaciones.controller.ts) | [notificaciones.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/notificaciones/notificaciones.routes.ts) |
| Devoluciones | [devoluciones.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/devoluciones/devoluciones.controller.ts) | [devoluciones.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/devoluciones/devoluciones.routes.ts) |
| Auditoría | [auditoria.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/auditoria/auditoria.controller.ts) | [auditoria.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/auditoria/auditoria.routes.ts) |
| Cierre Arqueo | [arqueo.controller.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/caja/Arqueo/arqueo.controller.ts) (modificado) | [arqueo.routes.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/caja/Arqueo/arqueo.routes.ts) (modificado) |

### Entidades Nuevas
| Entity | Archivo |
|--------|---------|
| TasaCambio | [TasaCambio.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/admin/entities/TasaCambio.ts) |
| Auditoria | [Auditoria.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/admin/entities/Auditoria.ts) |
| Notificacion | [Notificacion.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/modules/admin/entities/Notificacion.ts) |

### App Principal
- [app.ts](file:///c:/Users/Marvin/Desktop/UNI/Software2/api-nathaly/src/app.ts) — Registra los 7 nuevos módulos

---

## ⚡ Resumen de Endpoints (22 nuevos)

| # | Método | Ruta | Descripción |
|---|--------|------|-------------|
| 1 | `GET` | `/dashboard/resumen` | KPIs: ventasMes, productosActivos, clientesRegistrados, saldoCaja, ventasSemana |
| 2 | `GET` | `/dashboard/actividad-reciente` | Últimas 10 operaciones del sistema |
| 3 | `GET` | `/reportes/ventas` | Reporte de ventas con filtros |
| 4 | `GET` | `/reportes/ventas/exportar` | Descarga PDF del reporte |
| 5 | `GET` | `/reportes/compras` | Reporte de compras |
| 6 | `GET` | `/reportes/inventario/valorizado` | Inventario valorizado por sucursal |
| 7 | `GET` | `/reportes/caja/cierre-diario` | Cierre de caja del día |
| 8 | `GET` | `/configuracion/tasa-cambio` | Tasa de cambio actual |
| 9 | `PUT` | `/configuracion/tasa-cambio` | Actualizar tasa de cambio |
| 10 | `PATCH` | `/arqueos/:id/cerrar` | Cerrar arqueo con cálculo de diferencias |
| 11 | `GET` | `/busqueda?q=` | Búsqueda global en productos, clientes, facturas, pedidos |
| 12 | `GET` | `/notificaciones` | Lista de notificaciones (stock bajo + pagos pendientes) |
| 13 | `PATCH` | `/notificaciones/:id/leer` | Marcar notificación como leída |
| 14 | `GET` | `/notificaciones/alertas-stock` | Productos con stock bajo |
| 15 | `POST` | `/devoluciones` | Registrar devolución (crea NC + devuelve stock) |
| 16 | `GET` | `/devoluciones` | Listar devoluciones |
| 17 | `GET` | `/devoluciones/:id` | Detalle de una devolución |
| 18 | `GET` | `/auditoria` | Historial de cambios filtrable |
