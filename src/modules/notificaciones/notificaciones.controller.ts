import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';
import { Notificacion } from '../admin/entities/Notificacion';

/**
 * GET /notificaciones
 * Lista de notificaciones del usuario actual (stock bajo, pagos pendientes, etc.)
 */
export const obtenerNotificaciones = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const usuarioId = req.user?.id;

        // Notificaciones almacenadas + generadas dinámicamente
        let notificacionesAlmacenadas: any[] = [];

        try {
            const repo = AppDataSource.getRepository(Notificacion);
            notificacionesAlmacenadas = await repo.find({
                where: [
                    { usuarioId: usuarioId },
                    { usuarioId: undefined as any }, // Notificaciones globales (null)
                ],
                order: { fecha: 'DESC' },
                take: 50,
            });
        } catch {
            // La tabla no existe aún, generar notificaciones dinámicas
        }

        // Generar notificaciones dinámicas de stock bajo
        const stockBajo = await AppDataSource.query(...sql`
            SELECT
                p.IdProducto,
                p.Codigo,
                p.Descripcion,
                e.Stock,
                p.ExistenciaMin,
                b.Nombre AS Bodega
            FROM INVENTARIO.Existencia e
            INNER JOIN INVENTARIO.Producto p ON p.IdProducto = e.IdProducto
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = e.IdBodega
            WHERE p.Eliminado = 0 AND e.Eliminado = 0
              AND e.Stock <= p.ExistenciaMin
              AND p.ExistenciaMin > 0
        `.toQuery());

        const notificacionesStock = (stockBajo || []).map((item: any) => ({
            id: `stock-${item.IdProducto}`,
            tipo: 'stock_bajo',
            titulo: `Stock bajo: ${item.Descripcion}`,
            descripcion: `El producto ${item.Codigo} tiene ${item.Stock} unidades en ${item.Bodega} (mínimo: ${item.ExistenciaMin})`,
            entidad: 'producto',
            entidadId: item.IdProducto,
            leida: false,
            fecha: new Date(),
        }));

        // Ventas pendientes de pago
        const ventasPendientes = await AppDataSource.query(...sql`
            SELECT
                v.IdVenta,
                v.NumeroVenta,
                v.Total,
                v.Fecha,
                CONCAT(pc.Nombre1, ' ', pc.Apellido1) AS Cliente
            FROM VENTAS.Venta v
            INNER JOIN CATALOGOS.Estado es ON v.IdEstado = es.IdEstado
            INNER JOIN CATALOGOS.Cliente c ON v.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            WHERE v.Eliminado = 0 AND es.Codigo = 'FACT_PENDIENTE'
            ORDER BY v.Fecha ASC
        `.toQuery());

        const notificacionesPagos = (ventasPendientes || []).map((v: any) => ({
            id: `pago-${v.IdVenta}`,
            tipo: 'pago_pendiente',
            titulo: `Pago pendiente: ${v.NumeroVenta}`,
            descripcion: `Factura ${v.NumeroVenta} de ${v.Cliente} por C$ ${parseFloat(v.Total).toFixed(2)}`,
            entidad: 'venta',
            entidadId: v.IdVenta,
            leida: false,
            fecha: new Date(v.Fecha),
        }));

        // Combinar notificaciones almacenadas + dinámicas
        const todas = [
            ...notificacionesAlmacenadas.map((n: any) => ({
                id: n.idNotificacion,
                tipo: n.tipo,
                titulo: n.titulo,
                descripcion: n.descripcion,
                entidad: n.entidad,
                entidadId: n.entidadId,
                leida: n.leida,
                fecha: n.fecha,
            })),
            ...notificacionesStock,
            ...notificacionesPagos,
        ];

        // Ordenar por fecha descendente
        todas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return res.status(200).json({
            success: true,
            message: 'Notificaciones obtenidas correctamente',
            data: todas,
            noLeidas: todas.filter(n => !n.leida).length,
        });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones',
        });
    }
};

/**
 * PATCH /notificaciones/:id/leer
 * Marca una notificación como leída
 */
export const marcarComoLeida = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'El id de la notificación es requerido.',
            });
        }

        try {
            const repo = AppDataSource.getRepository(Notificacion);
            await repo.update(id, { leida: true });
        } catch {
            // Si es una notificación dinámica (stock_bajo, pago_pendiente), no se puede marcar
            // Se puede implementar un almacenamiento local de notificaciones leídas
        }

        return res.status(200).json({
            success: true,
            message: 'Notificación marcada como leída',
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al marcar notificación como leída',
        });
    }
};

/**
 * GET /inventario/alertas-stock?umbral={min}
 * Productos con stock por debajo del umbral
 */
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
