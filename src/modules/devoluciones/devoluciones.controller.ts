import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';

/**
 * POST /devoluciones
 * Registra una devolución asociada a una venta.
 * Body: { idVenta, motivo, detalles: [{idProducto, cantidad}] }
 */
export const registrarDevolucion = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { idVenta, motivo, detalles } = req.body;
        const creadoPor = req.user?.id;

        if (!idVenta) {
            return res.status(400).json({
                success: false,
                message: 'El id de la venta es requerido.',
            });
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Los detalles de la devolución son requeridos.',
            });
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verificar que la venta existe
            const ventaResult = await queryRunner.query(...sql`
                SELECT v.IdVenta, v.NumeroVenta, v.Total, v.IdBodega
                FROM VENTAS.Venta v
                WHERE v.IdVenta = ${parseInt(idVenta, 10)} AND v.Eliminado = 0
            `.toQuery());

            if (!ventaResult || ventaResult.length === 0) {
                throw new Error('La venta no existe o ha sido eliminada');
            }

            const venta = ventaResult[0];

            // 2. Verificar los detalles de venta para cada producto
            let totalDevolucion = 0;
            const detallesValidados = [];

            for (const det of detalles) {
                const idProducto = parseInt(det.idProducto, 10);
                const cantidad = parseFloat(det.cantidad);

                if (isNaN(idProducto) || idProducto <= 0 || isNaN(cantidad) || cantidad <= 0) {
                    throw new Error('Cada detalle debe tener un idProducto y cantidad válidos.');
                }

                // Verificar que el producto existe en la venta
                const ventaDetResult = await queryRunner.query(...sql`
                    SELECT vd.IdVentaDetalle, vd.IdProducto, vd.Cantidad, vd.PrecioUnitario
                    FROM VENTAS.VentaDetalle vd
                    WHERE vd.IdVenta = ${parseInt(idVenta, 10)}
                      AND vd.IdProducto = ${idProducto}
                      AND vd.Eliminado = 0
                `.toQuery());

                if (!ventaDetResult || ventaDetResult.length === 0) {
                    throw new Error(`El producto ${idProducto} no existe en la venta`);
                }

                const ventaDet = ventaDetResult[0];

                if (cantidad > parseFloat(ventaDet.Cantidad)) {
                    throw new Error(`La cantidad a devolver (${cantidad}) excede la cantidad vendida (${ventaDet.Cantidad}) del producto ${idProducto}`);
                }

                const monto = cantidad * parseFloat(ventaDet.PrecioUnitario);
                totalDevolucion += monto;

                detallesValidados.push({
                    idVentaDetalle: ventaDet.IdVentaDetalle,
                    idProducto,
                    cantidad,
                    monto,
                    precioUnitario: parseFloat(ventaDet.PrecioUnitario),
                });
            }

            // 3. Generar número de nota de crédito
            const consecutivoResult = await queryRunner.query(...sql`
                UPDATE ADMIN.Consecutivos SET ValorActual = ValorActual + 1
                OUTPUT INSERTED.ValorActual
                WHERE Entidad = 'NOTA_CREDITO'
            `.toQuery());

            let numeroNC: string;
            if (consecutivoResult && consecutivoResult.length > 0) {
                numeroNC = `NC-${consecutivoResult[0].ValorActual.toString().padStart(8, '0')}`;
            } else {
                // Si no existe el consecutivo, crear uno
                await queryRunner.query(...sql`
                    INSERT INTO ADMIN.Consecutivos (Entidad, ValorActual) VALUES ('NOTA_CREDITO', 1)
                `.toQuery());
                numeroNC = 'NC-00000001';
            }

            // 4. Insertar Nota de Crédito
            const ncResult = await queryRunner.query(...sql`
                INSERT INTO VENTAS.NotaCredito (NumeroNC, IdVenta, Fecha, IdEstadoNota, Motivo, Total, CreadoPor)
                OUTPUT INSERTED.IdNotaCredito
                VALUES (${numeroNC}, ${parseInt(idVenta, 10)}, SYSDATETIME(), 1, ${motivo || 'Devolución'}, ${totalDevolucion}, ${creadoPor || 1})
            `.toQuery());

            const idNotaCredito = ncResult[0].IdNotaCredito;

            // 5. Insertar detalles de la nota de crédito y devolver stock
            for (const det of detallesValidados) {
                // Insertar detalle NC
                await queryRunner.query(...sql`
                    INSERT INTO VENTAS.NotaCreditoDetalle (IdNotaCredito, IdVentaDetalle, Cantidad, Monto, IdMotivoDevol, CreadoPor)
                    VALUES (${idNotaCredito}, ${det.idVentaDetalle}, ${det.cantidad}, ${det.monto}, 1, ${creadoPor || 1})
                `.toQuery());

                // Devolver stock al inventario
                await queryRunner.query(...sql`
                    UPDATE INVENTARIO.Existencia
                    SET Stock = Stock + ${det.cantidad},
                        ModificadoPor = ${creadoPor || 1},
                        FechaModificacion = SYSDATETIME()
                    WHERE IdProducto = ${det.idProducto} AND IdBodega = ${venta.IdBodega}
                `.toQuery());

                // Registrar movimiento en Kardex
                await queryRunner.query(...sql`
                    INSERT INTO INVENTARIO.Kardex (IdTipoMov, ReferenciaId, IdBodega, IdProducto, Fecha, Cantidad, CostoUnit, Observacion, CreadoPor)
                    VALUES (5, ${idNotaCredito}, ${venta.IdBodega}, ${det.idProducto}, SYSDATETIME(), ${det.cantidad}, ${det.precioUnitario}, ${'Devolución NC: ' + numeroNC}, ${creadoPor || 1})
                `.toQuery());
            }

            await queryRunner.commitTransaction();

            return res.status(201).json({
                success: true,
                message: 'Devolución registrada correctamente',
                data: {
                    idNotaCredito,
                    numeroNC,
                    totalDevolucion,
                    detalles: detallesValidados,
                },
            });
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al registrar la devolución',
            });
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error('Error al registrar devolución:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar devolución',
        });
    }
};

/**
 * GET /devoluciones?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Lista devoluciones con filtros
 */
export const listarDevoluciones = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { desde, hasta } = req.query;

        let filtroFechas = sql``;
        if (desde && hasta) {
            filtroFechas = sql`AND CAST(nc.Fecha AS DATE) BETWEEN ${desde} AND ${hasta}`;
        }

        const result = await AppDataSource.query(...sql`
            SELECT
                nc.IdNotaCredito,
                nc.NumeroNC,
                nc.Fecha,
                nc.Total,
                nc.Motivo,
                v.NumeroVenta,
                v.IdVenta,
                CONCAT(pc.Nombre1, ' ', pc.Apellido1) AS Cliente,
                u.Login AS CreadoPorUsuario
            FROM VENTAS.NotaCredito nc
            INNER JOIN VENTAS.Venta v ON v.IdVenta = nc.IdVenta
            INNER JOIN CATALOGOS.Cliente c ON c.IdCliente = v.IdCliente
            INNER JOIN GENERAL.Persona pc ON pc.IdPersona = c.IdPersona
            LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = nc.CreadoPor
            WHERE nc.Eliminado = 0
              ${filtroFechas}
            ORDER BY nc.Fecha DESC
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Devoluciones obtenidas correctamente',
            data: (result || []).map((r: any) => toCamelCase(r)),
        });
    } catch (error) {
        console.error('Error al listar devoluciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al listar devoluciones',
        });
    }
};

/**
 * GET /devoluciones/:id
 * Detalle de una devolución
 */
export const obtenerDevolucion = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El id de la devolución es requerido y debe ser numérico.',
            });
        }

        // Nota de crédito
        const ncResult = await AppDataSource.query(...sql`
            SELECT
                nc.IdNotaCredito,
                nc.NumeroNC,
                nc.Fecha,
                nc.Total,
                nc.Motivo,
                nc.IdEstadoNota,
                v.NumeroVenta,
                v.IdVenta,
                CONCAT(pc.Nombre1, ' ', ISNULL(pc.Nombre2, ''), ' ', pc.Apellido1) AS Cliente,
                u.Login AS CreadoPorUsuario,
                nc.FechaCreacion
            FROM VENTAS.NotaCredito nc
            INNER JOIN VENTAS.Venta v ON v.IdVenta = nc.IdVenta
            INNER JOIN CATALOGOS.Cliente c ON c.IdCliente = v.IdCliente
            INNER JOIN GENERAL.Persona pc ON pc.IdPersona = c.IdPersona
            LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = nc.CreadoPor
            WHERE nc.IdNotaCredito = ${id} AND nc.Eliminado = 0
        `.toQuery());

        if (!ncResult || ncResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Devolución no encontrada.',
            });
        }

        // Detalles
        const detallesResult = await AppDataSource.query(...sql`
            SELECT
                ncd.IdNotaDetalle,
                ncd.Cantidad,
                ncd.Monto,
                p.Codigo AS CodigoProducto,
                p.Descripcion AS Producto,
                vd.PrecioUnitario
            FROM VENTAS.NotaCreditoDetalle ncd
            INNER JOIN VENTAS.VentaDetalle vd ON vd.IdVentaDetalle = ncd.IdVentaDetalle
            INNER JOIN INVENTARIO.Producto p ON p.IdProducto = vd.IdProducto
            WHERE ncd.IdNotaCredito = ${id} AND ncd.Eliminado = 0
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Devolución obtenida correctamente',
            data: {
                ...toCamelCase(ncResult[0]),
                detalles: (detallesResult || []).map((d: any) => toCamelCase(d)),
            },
        });
    } catch (error) {
        console.error('Error al obtener devolución:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener devolución',
        });
    }
};
