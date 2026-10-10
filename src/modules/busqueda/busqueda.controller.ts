import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';

/**
 * GET /busqueda?q={termino}
 * Busca en productos, clientes, facturas y pedidos. Retorna resultados agrupados por tipo
 */
export const busquedaGlobal = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || (q as string).trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El término de búsqueda debe tener al menos 2 caracteres.',
            });
        }

        const termino = (q as string).trim();

        // Buscar productos
        const productos = await AppDataSource.query(...sql`
            SELECT TOP 10
                p.IdProducto AS Id,
                p.Codigo,
                p.Descripcion,
                p.Costo
            FROM INVENTARIO.Producto p
            WHERE p.Eliminado = 0
              AND (p.Codigo LIKE ${'%' + termino + '%'} OR p.Descripcion LIKE ${'%' + termino + '%'} OR p.Referencia LIKE ${'%' + termino + '%'})
        `.toQuery());

        // Buscar clientes
        const clientes = await AppDataSource.query(...sql`
            SELECT TOP 10
                c.IdCliente AS Id,
                c.Codigo,
                CONCAT(pe.Nombre1, ' ', ISNULL(pe.Nombre2, ''), ' ', pe.Apellido1, ' ', ISNULL(pe.Apellido2, '')) AS Nombre,
                pe.Cedula
            FROM CATALOGOS.Cliente c
            INNER JOIN GENERAL.Persona pe ON pe.IdPersona = c.IdPersona
            WHERE c.Eliminado = 0
              AND (c.Codigo LIKE ${'%' + termino + '%'}
                   OR pe.Nombre1 LIKE ${'%' + termino + '%'}
                   OR pe.Apellido1 LIKE ${'%' + termino + '%'}
                   OR pe.Cedula LIKE ${'%' + termino + '%'})
        `.toQuery());

        // Buscar facturas (ventas)
        const facturas = await AppDataSource.query(...sql`
            SELECT TOP 10
                v.IdVenta AS Id,
                v.NumeroVenta AS Numero,
                v.Fecha,
                v.Total,
                CONCAT(pc.Nombre1, ' ', pc.Apellido1) AS Cliente,
                es.Descripcion AS Estado
            FROM VENTAS.Venta v
            INNER JOIN CATALOGOS.Cliente c ON v.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            INNER JOIN CATALOGOS.Estado es ON v.IdEstado = es.IdEstado
            WHERE v.Eliminado = 0
              AND (v.NumeroVenta LIKE ${'%' + termino + '%'})
        `.toQuery());

        // Buscar pedidos
        const pedidos = await AppDataSource.query(...sql`
            SELECT TOP 10
                p.IdPedido AS Id,
                p.NumeroPedido AS Numero,
                p.FechaPedido AS Fecha,
                p.Total,
                CONCAT(pc.Nombre1, ' ', pc.Apellido1) AS Cliente
            FROM VENTAS.Pedido p
            INNER JOIN CATALOGOS.Cliente c ON p.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            WHERE p.Eliminado = 0
              AND (p.NumeroPedido LIKE ${'%' + termino + '%'})
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Búsqueda realizada correctamente',
            data: {
                productos: (productos || []).map((p: any) => toCamelCase(p)),
                clientes: (clientes || []).map((c: any) => toCamelCase(c)),
                facturas: (facturas || []).map((f: any) => toCamelCase(f)),
                pedidos: (pedidos || []).map((p: any) => toCamelCase(p)),
                totalResultados:
                    (productos?.length || 0) +
                    (clientes?.length || 0) +
                    (facturas?.length || 0) +
                    (pedidos?.length || 0),
            },
        });
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en búsqueda global',
        });
    }
};
