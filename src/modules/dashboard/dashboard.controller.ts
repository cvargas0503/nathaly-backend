import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';

/**
 * GET /dashboard/resumen
 * Retorna: ventasMes, productosActivos, clientesRegistrados, saldoCaja, ventasSemana
 */
export const obtenerResumen = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Ventas del mes actual
        const ventasMesResult = await AppDataSource.query(`
            SELECT ISNULL(SUM(v.Total), 0) AS VentasMes
            FROM VENTAS.Venta v
            WHERE v.Eliminado = 0
              AND MONTH(v.Fecha) = MONTH(GETDATE())
              AND YEAR(v.Fecha) = YEAR(GETDATE())
        `);
        const ventasMes = parseFloat(ventasMesResult[0]?.VentasMes) || 0;

        // Productos activos (no eliminados)
        const productosResult = await AppDataSource.query(`
            SELECT COUNT(*) AS ProductosActivos
            FROM INVENTARIO.Producto
            WHERE Eliminado = 0
        `);
        const productosActivos = productosResult[0]?.ProductosActivos || 0;

        // Clientes registrados (activos)
        const clientesResult = await AppDataSource.query(`
            SELECT COUNT(*) AS ClientesRegistrados
            FROM CATALOGOS.Cliente
            WHERE Eliminado = 0 AND Activo = 1
        `);
        const clientesRegistrados = clientesResult[0]?.ClientesRegistrados || 0;

        // Saldo en caja (sum ingresos - sum egresos del día)
        const saldoCajaResult = await AppDataSource.query(`
            SELECT
                ISNULL(SUM(CASE WHEN mc.EsIngreso = 1 THEN mcd.Monto ELSE 0 END), 0)
                - ISNULL(SUM(CASE WHEN mc.EsIngreso = 0 THEN mcd.Monto ELSE 0 END), 0) AS SaldoCaja
            FROM CAJA.MovimientoCaja mc
            INNER JOIN CAJA.MovimientoCajaDetalle mcd ON mcd.IdMovimientoCaja = mc.IdMovimiento
            WHERE mc.Eliminado = 0
              AND mcd.CodigoMoneda = 'NIO'
              AND CAST(mc.Fecha AS DATE) = CAST(GETDATE() AS DATE)
        `);
        const saldoCaja = parseFloat(saldoCajaResult[0]?.SaldoCaja) || 0;

        // Ventas de los últimos 7 días para gráfico
        const ventasSemanaResult = await AppDataSource.query(`
            SELECT
                CAST(v.Fecha AS DATE) AS Dia,
                ISNULL(SUM(v.Total), 0) AS Total
            FROM VENTAS.Venta v
            WHERE v.Eliminado = 0
              AND v.Fecha >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
            GROUP BY CAST(v.Fecha AS DATE)
            ORDER BY Dia ASC
        `);

        // Generar array de 7 días (rellenar con 0 los días sin ventas)
        const ventasSemana: { dia: string; total: number }[] = [];
        const hoy = new Date();
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - i);
            const diaStr = fecha.toISOString().split('T')[0];
            const encontrado = ventasSemanaResult.find(
                (r: any) => new Date(r.Dia).toISOString().split('T')[0] === diaStr
            );
            ventasSemana.push({
                dia: diaStr,
                total: encontrado ? parseFloat(encontrado.Total) : 0,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Resumen del dashboard obtenido correctamente',
            data: {
                ventasMes,
                productosActivos,
                clientesRegistrados,
                saldoCaja,
                ventasSemana,
            },
        });
    } catch (error) {
        console.error('Error al obtener resumen del dashboard:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del dashboard',
        });
    }
};

/**
 * GET /dashboard/actividad-reciente
 * Últimas 10 operaciones del sistema (ventas, compras, pagos, etc.)
 */
export const obtenerActividadReciente = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const actividades = await AppDataSource.query(`
            SELECT TOP 10 * FROM (
                -- Ventas
                SELECT
                    'venta' AS Tipo,
                    'Nueva venta ' + v.NumeroVenta + ' por C$ ' + CAST(v.Total AS NVARCHAR(50)) AS Descripcion,
                    u.Login AS Usuario,
                    v.FechaCreacion AS Fecha
                FROM VENTAS.Venta v
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = v.CreadoPor
                WHERE v.Eliminado = 0

                UNION ALL

                -- Movimientos de caja (pagos)
                SELECT
                    CASE WHEN mc.EsIngreso = 1 THEN 'pago' ELSE 'egreso' END AS Tipo,
                    mc.Concepto AS Descripcion,
                    u.Login AS Usuario,
                    mc.FechaCreacion AS Fecha
                FROM CAJA.MovimientoCaja mc
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = mc.CreadoPor
                WHERE mc.Eliminado = 0

                UNION ALL

                -- Arqueos
                SELECT
                    'arqueo' AS Tipo,
                    'Apertura/cierre de caja' AS Descripcion,
                    u.Login AS Usuario,
                    ac.FechaCreacion AS Fecha
                FROM CAJA.AperturaCierreCaja ac
                LEFT JOIN SEGURIDAD.Usuario u ON u.IdUsuario = ac.CreadoPor
                WHERE ac.Eliminado = 0
            ) AS Actividades
            ORDER BY Fecha DESC
        `);

        const data = (actividades || []).map((a: any) => toCamelCase(a));

        return res.status(200).json({
            success: true,
            message: 'Actividad reciente obtenida correctamente',
            data,
        });
    } catch (error) {
        console.error('Error al obtener actividad reciente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener actividad reciente',
        });
    }
};
