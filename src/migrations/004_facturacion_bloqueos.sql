-- Snapshot inspected on 2026-10-11. Apply only after reviewing existing schema.
CREATE OR ALTER PROCEDURE [VENTAS].[sp_Venta_Insertar_Optimizado]
    @IdCliente INT,
    @IdEmpleado INT,
    @IdSucursal INT,
    @Fecha DATETIME2,
    @IdTermino SMALLINT,
    @UsuarioId INT,
	@Observacion NVARCHAR(250) = NULL,
    @Detalles VENTAS.TipoVentaDetalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT IdProducto FROM @Detalles GROUP BY IdProducto HAVING COUNT(*) > 1)
        THROW 50004, 'Cada producto debe aparecer una sola vez.', 1;

    BEGIN TRY
        BEGIN TRAN;
		 DECLARE @ProductosInvalidos NVARCHAR(MAX) = '';
		 DECLARE @IdBodega INT
		
		SET @IdBodega = (
		SELECT TOP 1 IdBodega FROM INVENTARIO.Bodega where IdSucursal = @IdSucursal
		AND Eliminado = 0 AND Activo = 1 AND EsPrincipal = 1)

		IF @IdBodega IS NULL
		BEGIN
			THROW 50002, 'No se encontró una bodega principal activa para esta sucursal.', 1;
		END


		SELECT @ProductosInvalidos = STRING_AGG(ISNULL(P.Referencia, 'SIN REFERENCIA'), ', ')
		FROM @Detalles D
		LEFT JOIN INVENTARIO.Existencia E WITH (UPDLOCK, HOLDLOCK) ON E.IdProducto = D.IdProducto AND E.IdBodega = @IdBodega
		INNER JOIN INVENTARIO.Producto P ON D.IdProducto = P.IdProducto
		WHERE E.IdProducto IS NULL OR E.Stock < D.Cantidad;

		IF @ProductosInvalidos IS NOT NULL AND LEN(@ProductosInvalidos) > 0
		BEGIN
			DECLARE @MensajeError NVARCHAR(MAX) = 'Los siguientes productos no tienen suficiente stock o no existen en la bodega: ' + @ProductosInvalidos;
			THROW 50001, @MensajeError, 1;
		END

		DECLARE @CodigoSucursal NVARCHAR(10);
		SELECT @CodigoSucursal = CodigoSucursal
		FROM CATALOGOS.Sucursal
		WHERE IdSucursal = @IdSucursal;

		IF @CodigoSucursal IS NULL
		BEGIN
			THROW 50003, 'No se encontró el código de la sucursal.', 1;
		END

		DECLARE @Consecutivo BIGINT;

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'VENTA';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'VENTA';

		DECLARE @NumeroVenta NVARCHAR(20);
		SET @NumeroVenta = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);
        -- Calcular montos
        DECLARE @Subtotal DECIMAL(18,4), @Descuento DECIMAL(18,4);
        SELECT 
            @Subtotal = SUM(Cantidad * PrecioUnitario),
            @Descuento = SUM(Descuento)
        FROM @Detalles;

        -- Insertar encabezado
        DECLARE @IdVenta BIGINT;
        INSERT INTO VENTAS.Venta (
            NumeroVenta, IdCliente, IdEmpleado, IdBodega, Fecha,
            Subtotal, Descuento, Impuestos, IdTermino, IdEstado, IdEstadoCxc,
            CreadoPor, FechaCreacion, Observacion
        )
        VALUES (
            @NumeroVenta, @IdCliente, @IdEmpleado, @IdBodega, @Fecha,
            @Subtotal, @Descuento, 0, @IdTermino, 1, 3,
            @UsuarioId, SYSDATETIME(), @Observacion
        );

        SET @IdVenta = SCOPE_IDENTITY();

        -- Insertar detalles
        INSERT INTO VENTAS.VentaDetalle (
            IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        -- Actualizar existencia
        UPDATE E
        SET 
            E.Stock = E.Stock - D.Cantidad,
            E.ModificadoPor = @UsuarioId,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        INNER JOIN @Detalles D ON D.IdProducto = E.IdProducto
        WHERE E.IdBodega = @IdBodega;

        -- Insertar en Kardex
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodega, IdProducto, 7, @IdVenta, @Fecha,
            -Cantidad, PrecioUnitario, CONCAT('Venta ', @NumeroVenta),
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        COMMIT;

		SELECT @IdVenta AS IdVenta
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
