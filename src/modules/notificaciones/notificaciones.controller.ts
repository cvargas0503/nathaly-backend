import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';
import { Notificacion } from '../admin/entities/Notificacion';

import { listNotifications, readNotification } from './notificaciones.service';
import { fail, HttpError } from '../../utils/feature';
export const obtenerNotificaciones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) throw new HttpError(401, 'Sesión requerida');
    const result = await AppDataSource.transaction(m => listNotifications(m, req.user!.id, req.query));
    return res.json({ success: true, message: 'Notificaciones obtenidas correctamente', ...result });
  } catch (e) { return fail(res, e); }
};
export const marcarComoLeida = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) throw new HttpError(401, 'Sesión requerida');
    if (req.body?.usuarioId !== undefined || req.body?.idUsuario !== undefined) throw new HttpError(400, 'Usuario se obtiene de sesión');
    await AppDataSource.transaction(m => readNotification(m, req.user!.id, req.params.id));
    return res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (e) { return fail(res, e); }
};

export const alertasStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const umbral = parseInt(req.query.umbral as string, 10);
        const umbralFinal = isNaN(umbral) ? 0 : umbral;

        const result = await AppDataSource.query(...sql`
            SELECT
                p.IdProducto,
                p.Codigo,
                p.Descripcion,
                e.Stock,
                p.ExistenciaMin,
                p.ExistenciaMax,
                p.Costo,
                b.Nombre AS Bodega,
                s.Nombre AS Sucursal
            FROM INVENTARIO.Existencia e
            INNER JOIN INVENTARIO.Producto p ON p.IdProducto = e.IdProducto
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = e.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON s.IdSucursal = b.IdSucursal
            WHERE p.Eliminado = 0 AND e.Eliminado = 0
              AND (e.Stock <= ${umbralFinal > 0 ? umbralFinal : sql`p.ExistenciaMin`})
              AND (p.ExistenciaMin > 0 OR ${umbralFinal} > 0)
            ORDER BY e.Stock ASC
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Alertas de stock obtenidas correctamente',
            data: (result || []).map((r: any) => toCamelCase(r)),
            total: result?.length || 0,
        });
    } catch (error) {
        console.error('Error al obtener alertas de stock:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener alertas de stock',
        });
    }
};
