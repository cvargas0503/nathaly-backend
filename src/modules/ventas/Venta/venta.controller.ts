import { Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import sql from 'mssql';
import { getMSSQLPool } from '../../../database';
import { toCamelCase } from '../../../helpers';
import { FacturacionFacade, FacturacionError } from '../facturacion/facturacion.facade';
import { SqlTransaccionesFacturacion } from '../facturacion/facturacion.sql';
const facturacion = new FacturacionFacade(new SqlTransaccionesFacturacion());

export const insertarVenta = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await facturacion.confirmar(req.body, req.user?.id ?? 0, req.get('Idempotency-Key') ?? '');
        return res.status(result.reutilizada ? 200 : 201).json({
            message: result.reutilizada ? 'Factura previamente registrada.' : 'Venta insertada correctamente.',
            data: toCamelCase(result.factura), success: true, reutilizada: result.reutilizada,
        });
    } catch (error: any) {
        if (error instanceof FacturacionError) return res.status(error.status).json({ message: error.message, success: false });
        if ([50001, 50002, 50003].includes(error?.number)) {
            return res.status(400).json({ message: 'No fue posible confirmar la factura. Verifique la sucursal y las existencias.', success: false });
        }
        console.error('Error al confirmar factura:', error);
        return res.status(500).json({ message: 'Error al insertar la venta.', success: false });
    }
};

export const obtenerTodasLasVentas = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await AppDataSource.query('EXEC REPORTES.sp_Reporte_TodasLasVentas');
        console.log('Resultado de la consulta:', result);
        let ventas = result || [];

        ventas = ventas.map((venta: any) => {
            // Convertir detalles de string JSON a objeto
            if (venta.Detalles && typeof venta.Detalles === 'string') {
                try {
                    venta.Detalles = JSON.parse(venta.Detalles);
                } catch {
                    venta.Detalles = [];
                }
            }
            return toCamelCase(venta);
        });

        return res.status(200).json({"message": "Ventas obtenidas correctamente", "data": ventas, "success": true});
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        return res.status(500).json({ message: 'Error al obtener las ventas.' });
    }
};

export const eliminarVenta = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const idVenta = parseInt(req.params.idVenta, 10);
        const usuarioId = req.user?.id ?? null;

        if (isNaN(idVenta) || idVenta <= 0) {
            return res.status(400).json({ message: 'El id de la venta es requerido y debe ser numérico.' });
        }
        if (!usuarioId) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }

        const pool = await getMSSQLPool();
        await pool.request()
            .input('IdVenta', sql.BigInt, idVenta)
            .input('IdUsuario', sql.Int, usuarioId)
            .execute('VENTAS.sp_AnularFactura');

        return res.status(200).json({ message: 'Venta anulada correctamente.', success: true });
    } catch (error: any) {
        console.error('Error al anular la venta:', error);
        return res.status(500).json({ message: 'Error al anular la venta.' });
    }
};

export const obtenerVentasPendientesActivas = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Consulta: ventas activas y cuyo estado es FACT_PENDIENTE, trayendo datos relevantes
        const result = await AppDataSource.query(`
            SELECT 
                v.IdVenta as Id,
                v.NumeroVenta as Numero,
                v.Fecha,
                v.Total as Monto,
                CONCAT(pc.Nombre1, ' ', ISNULL(pc.Nombre2, ''), ' ', pc.Apellido1, ' ', ISNULL(pc.Apellido2, '')) AS Cliente,
                C.IdCliente,
                CONCAT(pe.Nombre1, ' ', ISNULL(pe.Nombre2, ''), ' ', pe.Apellido1, ' ', ISNULL(pe.Apellido2, '')) AS Empleado,
                e.IdEmpleado,
                v.Eliminado,
                v.IdEstado,
                s.Nombre AS Sucursal,
                s.IdSucursal,
                es.Descripcion AS Estado
            FROM VENTAS.Venta v
            INNER JOIN Catalogos.Estado es ON v.IdEstado = es.IdEstado
            INNER JOIN CATALOGOS.Cliente c ON v.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            INNER JOIN RRHH.Empleado e ON v.IdEmpleado = e.IdEmpleado
            INNER JOIN GENERAL.Persona pe ON e.IdPersona = pe.IdPersona
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = v.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON b.IdSucursal = s.IdSucursal
            WHERE es.Codigo = 'FACT_PENDIENTE' AND v.Eliminado = 0
            ORDER BY v.IdVenta DESC
        `);

        const ventas = (result || []).map((venta: any) => toCamelCase(venta));
        console.log('Ventas pendientes y activas obtenidas:', ventas);

        return res.status(200).json({
            message: "Ventas pendientes y activas obtenidas correctamente",
            data: ventas,
            success: true
        });
    } catch (error) {
        console.error('Error al obtener las ventas pendientes y activas:', error);
        return res.status(500).json({ message: 'Error al obtener las ventas pendientes y activas.' });
    }
};
