import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';

import { applyReturn, validateReturn, returnKey, availabilitySQL } from './devoluciones.service';
import { fail, HttpError, id } from '../../utils/feature';
export const registrarDevolucion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) throw new HttpError(401, 'Sesión requerida');
    const input = validateReturn(req.body), key = returnKey(req.headers['idempotency-key']);
    const data = await AppDataSource.transaction(m => applyReturn(m, input, req.user!.id, key));
    return res.status(data.replayed ? 200 : 201).json({ success: true, message: 'Devolución registrada correctamente', data });
  } catch (error) { return fail(res, error); }
};
export const disponibilidad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ventaId = id(req.params.idVenta);
    const data = await AppDataSource.transaction('REPEATABLE READ', async m => {
      const [sale] = await m.query('SELECT IdVenta FROM VENTAS.Venta WHERE IdVenta=@0 AND Eliminado=0', [ventaId]);
      if (!sale) throw new HttpError(404, 'Venta no encontrada');
      return m.query(availabilitySQL, [ventaId]);
    });
    return res.json({ success: true, data });
  } catch (error) { return fail(res, error); }
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
