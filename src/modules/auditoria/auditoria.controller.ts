import { sql, sqlJoin, SqlQuery } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';

/**
 * GET /auditoria?entidad={tipo}&desde={fecha}&hasta={fecha}
 * Historial de acciones (CRUD) filtrable por entidad
 *
 * Si la tabla ADMIN.Auditoria no existe, intenta generarla dinámicamente
 * a partir de los registros de creación/modificación de las tablas existentes.
 */
export const obtenerAuditoria = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { entidad, desde, hasta } = req.query;

        // Intentar obtener de la tabla de auditoría si existe
        try {
            let filtros = sql`WHERE 1=1`;
            if (entidad) {
                filtros = sql`${filtros} AND a.Entidad = ${entidad}`;
            }
            if (desde && hasta) {
                filtros = sql`${filtros} AND CAST(a.Fecha AS DATE) BETWEEN ${desde} AND ${hasta}`;
            }

            const result = await AppDataSource.query(...sql`
                SELECT TOP 100
                    a.IdAuditoria,
                    a.Entidad,
                    a.Accion,
                    a.EntidadId,
                    a.Descripcion,
                    a.UsuarioId,
                    a.UsuarioLogin,
                    a.Fecha,
                    a.IpAddress
                FROM ADMIN.Auditoria a
                ${filtros}
                ORDER BY a.Fecha DESC
            `.toQuery());

            return res.status(200).json({
                success: true,
                message: 'Auditoría obtenida correctamente',
                data: (result || []).map((r: any) => toCamelCase(r)),
            });
        } catch {
            // La tabla no existe, generar auditoría a partir de las tablas existentes
        }

        // Generar auditoría dinámica a partir de columnas de auditoría existentes en tablas
        let filtroFechas = sql``;
        if (desde && hasta) {
            filtroFechas = sql`AND CAST(Fecha AS DATE) BETWEEN ${desde} AND ${hasta}`;
        }

        const queries: SqlQuery[] = [];

        if (!entidad || entidad === 'ventas') {
            queries.push(sql`
                SELECT
                    'ventas' AS Entidad,
                    CASE
                        WHEN v.Eliminado = 1 THEN 'ELIMINAR'
                        WHEN v.ModificadoPor IS NOT NULL THEN 'MODIFICAR'
                        ELSE 'CREAR'
                    END AS Accion,
                    CAST(v.IdVenta AS NVARCHAR(50)) AS EntidadId,
                    'Venta ' + v.NumeroVenta AS Descripcion,
                    COALESCE(v.ModificadoPor, v.EliminadoPor, v.CreadoPor) AS UsuarioId,
                    u.Login AS UsuarioLogin,
                    COALESCE(v.FechaModificacion, v.FechaEliminacion, v.FechaCreacion) AS Fecha
                FROM VENTAS.Venta v
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = COALESCE(v.ModificadoPor, v.EliminadoPor, v.CreadoPor)
                WHERE 1=1 ${filtroFechas.replace('Fecha', 'COALESCE(v.FechaModificacion, v.FechaEliminacion, v.FechaCreacion)')}
            `);
        }

        if (!entidad || entidad === 'productos') {
            queries.push(sql`
                SELECT
                    'productos' AS Entidad,
                    CASE
                        WHEN p.Eliminado = 1 THEN 'ELIMINAR'
                        WHEN p.ModificadoPor IS NOT NULL THEN 'MODIFICAR'
                        ELSE 'CREAR'
                    END AS Accion,
                    CAST(p.IdProducto AS NVARCHAR(50)) AS EntidadId,
                    'Producto ' + p.Codigo + ' - ' + p.Descripcion AS Descripcion,
                    COALESCE(p.ModificadoPor, p.EliminadoPor, p.CreadoPor) AS UsuarioId,
                    u.Login AS UsuarioLogin,
                    COALESCE(p.FechaModificacion, p.FechaEliminacion, p.FechaCreacion) AS Fecha
                FROM INVENTARIO.Producto p
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = COALESCE(p.ModificadoPor, p.EliminadoPor, p.CreadoPor)
                WHERE 1=1 ${filtroFechas.replace('Fecha', 'COALESCE(p.FechaModificacion, p.FechaEliminacion, p.FechaCreacion)')}
            `);
        }

        if (!entidad || entidad === 'usuarios') {
            queries.push(sql`
                SELECT
                    'usuarios' AS Entidad,
                    CASE
                        WHEN u2.Eliminado = 1 THEN 'ELIMINAR'
                        WHEN u2.FechaModificacion IS NOT NULL THEN 'MODIFICAR'
                        ELSE 'CREAR'
                    END AS Accion,
                    CAST(u2.IdUsuario AS NVARCHAR(50)) AS EntidadId,
                    'Usuario ' + u2.Login AS Descripcion,
                    u2.IdUsuario AS UsuarioId,
                    u2.Login AS UsuarioLogin,
                    COALESCE(u2.FechaModificacion, u2.FechaEliminacion, u2.FechaCreacion) AS Fecha
                FROM SEGURIDAD.Usuario u2
                WHERE 1=1 ${filtroFechas.replace('Fecha', 'COALESCE(u2.FechaModificacion, u2.FechaEliminacion, u2.FechaCreacion)')}
            `);
        }

        if (!entidad || entidad === 'caja') {
            queries.push(sql`
                SELECT
                    'caja' AS Entidad,
                    CASE
                        WHEN ac.Eliminado = 1 THEN 'ELIMINAR'
                        WHEN ac.ModificadoPor IS NOT NULL THEN 'MODIFICAR'
                        ELSE 'CREAR'
                    END AS Accion,
                    CAST(ac.IdApertura AS NVARCHAR(50)) AS EntidadId,
                    'Apertura/Cierre Caja' AS Descripcion,
                    COALESCE(ac.ModificadoPor, ac.EliminadoPor, ac.CreadoPor) AS UsuarioId,
                    u.Login AS UsuarioLogin,
                    COALESCE(ac.FechaModificacion, ac.FechaEliminacion, ac.FechaCreacion) AS Fecha
                FROM CAJA.AperturaCierreCaja ac
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = COALESCE(ac.ModificadoPor, ac.EliminadoPor, ac.CreadoPor)
                WHERE 1=1 ${filtroFechas.replace('Fecha', 'COALESCE(ac.FechaModificacion, ac.FechaEliminacion, ac.FechaCreacion)')}
            `);
        }

        if (queries.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No se encontraron registros de auditoría para la entidad especificada',
                data: [],
            });
        }

        const unionQuery = sql`
            SELECT TOP 100 * FROM (
                ${sqlJoin(queries)}
            ) AS Auditoria
            ORDER BY Fecha DESC
        `;

        const result = await AppDataSource.query(...unionQuery.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Auditoría generada correctamente',
            data: (result || []).map((r: any) => toCamelCase(r)),
        });
    } catch (error) {
        console.error('Error al obtener auditoría:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener auditoría',
        });
    }
};
