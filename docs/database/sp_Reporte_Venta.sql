-- Snapshot inspected on 2026-10-11. Apply only after reviewing existing schema.
CREATE   PROCEDURE [REPORTES].[sp_Reporte_Venta]
    @IdVenta BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- ENCABEZADO
    SELECT 
        V.IdVenta,
        V.NumeroVenta,
		FORMAT(V.Fecha, 'dd-MM-yyyy') AS Fecha,
        FORMAT(V.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        CONCAT(
            ISNULL(P.Nombre1, ''), ' ', ISNULL(P.Nombre2, ''), ' ',
            ISNULL(P.Apellido1, ''), ' ', ISNULL(P.Apellido2, '')
        ) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        T.Codigo AS Termino,
        EC.Codigo AS EstadoCXC,
        ES.Descripcion AS Estado,
        V.Subtotal,
        V.Descuento,
        V.Impuestos,
        (V.Subtotal - V.Descuento + V.Impuestos) AS Total
    FROM VENTAS.Venta V
    LEFT JOIN CATALOGOS.Cliente C ON C.IdCliente = V.IdCliente
    LEFT JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    LEFT JOIN INVENTARIO.Bodega B ON B.IdBodega = V.IdBodega
	LEFT JOIN CATALOGOS.Sucursal S ON S.IdSucursal = B.IdSucursal
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = V.IdEmpleado
	LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN CATALOGOS.Termino T ON T.IdTermino = V.IdTermino
    LEFT JOIN CATALOGOS.EstadoCxc EC ON EC.IdEstadoCxc = V.IdEstadoCxc
    LEFT JOIN SEGURIDAD.Usuario U ON U.IdUsuario = V.CreadoPor
    LEFT JOIN CATALOGOS.Estado ES ON ES.IdEstado = V.IdEstado
    WHERE V.IdVenta = @IdVenta
    -- DETALLE
    SELECT 
        D.IdVentaDetalle,
        PR.Codigo,
        PR.Descripcion,
        D.Cantidad,
        D.PrecioUnitario,
        D.Descuento,
        D.Subtotal
    FROM VENTAS.VentaDetalle D
    JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
    WHERE D.IdVenta = @IdVenta AND D.Eliminado = 0
    ORDER BY D.IdVentaDetalle;
END
