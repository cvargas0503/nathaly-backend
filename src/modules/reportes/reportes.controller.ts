import { sql } from '../../utils/sql';
import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';
import puppeteer from 'puppeteer';

/**
 * GET /reportes/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&idSucursal=N
 * Reporte de ventas con filtros
 */
export const reporteVentas = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { desde, hasta, idSucursal } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                message: 'Los parámetros "desde" y "hasta" son requeridos.',
            });
        }

        let filtroSucursal = sql``;
        if (idSucursal) {
            filtroSucursal = sql`AND s.IdSucursal = ${parseInt(idSucursal as string, 10)}`;
        }

        // Resumen
        const resumenResult = await AppDataSource.query(...sql`
            SELECT
                COUNT(v.IdVenta) AS TotalFacturas,
                ISNULL(SUM(v.Subtotal), 0) AS Subtotal,
                ISNULL(SUM(v.Descuento), 0) AS Descuento,
                ISNULL(SUM(v.Impuestos), 0) AS Impuestos,
                ISNULL(SUM(v.Total), 0) AS Total
            FROM VENTAS.Venta v
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = v.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON s.IdSucursal = b.IdSucursal
            WHERE v.Eliminado = 0
              AND CAST(v.Fecha AS DATE) BETWEEN ${desde} AND ${hasta}
              ${filtroSucursal}
        `.toQuery());

        // Detalle
        const detalleResult = await AppDataSource.query(...sql`
            SELECT
                v.IdVenta,
                v.NumeroVenta,
                v.Fecha,
                v.Subtotal,
                v.Descuento,
                v.Impuestos,
                v.Total,
                CONCAT(pc.Nombre1, ' ', ISNULL(pc.Nombre2, ''), ' ', pc.Apellido1) AS Cliente,
                CONCAT(pe.Nombre1, ' ', ISNULL(pe.Nombre2, ''), ' ', pe.Apellido1) AS Empleado,
                s.Nombre AS Sucursal,
                es.Descripcion AS Estado
            FROM VENTAS.Venta v
            INNER JOIN CATALOGOS.Cliente c ON v.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            INNER JOIN RRHH.Empleado e ON v.IdEmpleado = e.IdEmpleado
            INNER JOIN GENERAL.Persona pe ON e.IdPersona = pe.IdPersona
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = v.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON b.IdSucursal = s.IdSucursal
            INNER JOIN CATALOGOS.Estado es ON v.IdEstado = es.IdEstado
            WHERE v.Eliminado = 0
              AND CAST(v.Fecha AS DATE) BETWEEN ${desde} AND ${hasta}
              ${filtroSucursal}
            ORDER BY v.Fecha DESC
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Reporte de ventas generado correctamente',
            data: {
                resumen: toCamelCase(resumenResult[0] || {}),
                detalle: (detalleResult || []).map((v: any) => toCamelCase(v)),
            },
        });
    } catch (error) {
        console.error('Error al generar reporte de ventas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas',
        });
    }
};

/**
 * GET /reportes/ventas/exportar?formato=pdf&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Descarga PDF del reporte de ventas
 */
export const exportarReporteVentas = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { desde, hasta, formato } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                message: 'Los parámetros "desde" y "hasta" son requeridos.',
            });
        }

        const detalleResult = await AppDataSource.query(...sql`
            SELECT
                v.NumeroVenta,
                v.Fecha,
                v.Subtotal,
                v.Descuento,
                v.Total,
                CONCAT(pc.Nombre1, ' ', pc.Apellido1) AS Cliente,
                CONCAT(pe.Nombre1, ' ', pe.Apellido1) AS Empleado,
                s.Nombre AS Sucursal,
                es.Descripcion AS Estado
            FROM VENTAS.Venta v
            INNER JOIN CATALOGOS.Cliente c ON v.IdCliente = c.IdCliente
            INNER JOIN GENERAL.Persona pc ON c.IdPersona = pc.IdPersona
            INNER JOIN RRHH.Empleado e ON v.IdEmpleado = e.IdEmpleado
            INNER JOIN GENERAL.Persona pe ON e.IdPersona = pe.IdPersona
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = v.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON b.IdSucursal = s.IdSucursal
            INNER JOIN CATALOGOS.Estado es ON v.IdEstado = es.IdEstado
            WHERE v.Eliminado = 0
              AND CAST(v.Fecha AS DATE) BETWEEN ${desde} AND ${hasta}
            ORDER BY v.Fecha DESC
        `.toQuery());

        // Generar HTML para el reporte
        const filas = (detalleResult || []).map((v: any) => `
            <tr>
                <td>${v.NumeroVenta}</td>
                <td>${new Date(v.Fecha).toLocaleDateString('es-NI')}</td>
                <td>${v.Cliente}</td>
                <td>${v.Empleado}</td>
                <td>${v.Sucursal}</td>
                <td style="text-align:right">C$ ${parseFloat(v.Subtotal).toFixed(2)}</td>
                <td style="text-align:right">C$ ${parseFloat(v.Descuento).toFixed(2)}</td>
                <td style="text-align:right">C$ ${parseFloat(v.Total).toFixed(2)}</td>
                <td>${v.Estado}</td>
            </tr>
        `).join('');

        const totalGeneral = detalleResult.reduce((acc: number, v: any) => acc + parseFloat(v.Total), 0);

        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Ventas</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
                h1 { text-align: center; color: #333; font-size: 18px; }
                h3 { color: #666; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                th { background-color: #4a90d9; color: white; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>Reporte de Ventas</h1>
            <h3>Período: ${desde} al ${hasta}</h3>
            <table>
                <thead>
                    <tr>
                        <th>N° Factura</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Empleado</th>
                        <th>Sucursal</th>
                        <th>Subtotal</th>
                        <th>Descuento</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
            <p class="total">Total General: C$ ${totalGeneral.toFixed(2)}</p>
            <p style="color:#999; text-align:center; margin-top:20px;">
                Generado el ${new Date().toLocaleDateString('es-NI')} a las ${new Date().toLocaleTimeString('es-NI')}
            </p>
        </body>
        </html>`;

        if (formato === 'pdf') {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
            });
            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=reporte_ventas_${desde}_${hasta}.pdf`,
            });
            return res.send(pdfBuffer);
        }

        // Default: retornar HTML
        res.set({ 'Content-Type': 'text/html' });
        return res.send(html);
    } catch (error) {
        console.error('Error al exportar reporte de ventas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al exportar reporte de ventas',
        });
    }
};

/**
 * GET /reportes/compras?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Reporte de compras
 */
export const reporteCompras = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                message: 'Los parámetros "desde" y "hasta" son requeridos.',
            });
        }

        const resumenResult = await AppDataSource.query(...sql`
            SELECT
                COUNT(*) AS TotalCompras,
                ISNULL(SUM(cd.Cantidad * cd.CostoUnit), 0) AS MontoTotal
            FROM COMPRAS.Compra c
            INNER JOIN COMPRAS.CompraDetalle cd ON cd.IdCompra = c.IdCompra
            WHERE c.Eliminado = 0
              AND CAST(c.FechaCompra AS DATE) BETWEEN ${desde} AND ${hasta}
        `.toQuery());

        const detalleResult = await AppDataSource.query(...sql`
            SELECT
                c.IdCompra,
                c.NumeroCompra,
                c.FechaCompra AS Fecha,
                prov.Nombre AS Proveedor,
                CONCAT(pe.Nombre1, ' ', pe.Apellido1) AS Empleado,
                b.Nombre AS Bodega,
                SUM(cd.Cantidad * cd.CostoUnit) AS Total
            FROM COMPRAS.Compra c
            INNER JOIN COMPRAS.CompraDetalle cd ON cd.IdCompra = c.IdCompra
            INNER JOIN CATALOGOS.Proveedor prov ON prov.IdProveedor = c.IdProveedor
            INNER JOIN RRHH.Empleado e ON e.IdEmpleado = c.IdEmpleado
            INNER JOIN GENERAL.Persona pe ON pe.IdPersona = e.IdPersona
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = c.IdBodega
            WHERE c.Eliminado = 0
              AND CAST(c.FechaCompra AS DATE) BETWEEN ${desde} AND ${hasta}
            GROUP BY c.IdCompra, c.NumeroCompra, c.FechaCompra, prov.Nombre, pe.Nombre1, pe.Apellido1, b.Nombre
            ORDER BY c.FechaCompra DESC
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Reporte de compras generado correctamente',
            data: {
                resumen: toCamelCase(resumenResult[0] || {}),
                detalle: (detalleResult || []).map((c: any) => toCamelCase(c)),
            },
        });
    } catch (error) {
        console.error('Error al generar reporte de compras:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar reporte de compras',
        });
    }
};

/**
 * GET /reportes/inventario/valorizado
 * Inventario valorizado por sucursal
 */
export const reporteInventarioValorizado = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await AppDataSource.query(...sql`
            SELECT
                s.IdSucursal,
                s.Nombre AS Sucursal,
                b.Nombre AS Bodega,
                p.Codigo AS CodigoProducto,
                p.Descripcion AS Producto,
                e.Stock,
                p.Costo,
                (e.Stock * p.Costo) AS ValorTotal
            FROM INVENTARIO.Existencia e
            INNER JOIN INVENTARIO.Producto p ON p.IdProducto = e.IdProducto
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = e.IdBodega
            INNER JOIN CATALOGOS.Sucursal s ON s.IdSucursal = b.IdSucursal
            WHERE p.Eliminado = 0 AND e.Eliminado = 0 AND b.Eliminado = 0
            ORDER BY s.Nombre, b.Nombre, p.Descripcion
        `.toQuery());

        // Calcular total valorizado
        const totalValorizado = (result || []).reduce((acc: number, r: any) => acc + parseFloat(r.ValorTotal || 0), 0);

        return res.status(200).json({
            success: true,
            message: 'Inventario valorizado obtenido correctamente',
            data: {
                totalValorizado,
                detalle: (result || []).map((r: any) => toCamelCase(r)),
            },
        });
    } catch (error) {
        console.error('Error al generar inventario valorizado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar inventario valorizado',
        });
    }
};

/**
 * GET /reportes/caja/cierre-diario?fecha=YYYY-MM-DD&idSucursal=N
 * Resumen de cierre de caja del día
 */
export const reporteCierreDiario = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { fecha, idSucursal } = req.query;

        if (!fecha) {
            return res.status(400).json({
                success: false,
                message: 'El parámetro "fecha" es requerido.',
            });
        }

        let filtroSucursal = sql``;
        if (idSucursal) {
            filtroSucursal = sql`AND ac.IdSucursal = ${parseInt(idSucursal as string, 10)}`;
        }

        // Resumen de movimientos del día
        const movimientosResult = await AppDataSource.query(...sql`
            SELECT
                ISNULL(SUM(CASE WHEN mc.EsIngreso = 1 AND mcd.CodigoMoneda = 'NIO' THEN mcd.Monto ELSE 0 END), 0) AS IngresoNio,
                ISNULL(SUM(CASE WHEN mc.EsIngreso = 1 AND mcd.CodigoMoneda = 'USD' THEN mcd.Monto ELSE 0 END), 0) AS IngresoUsd,
                ISNULL(SUM(CASE WHEN mc.EsIngreso = 0 AND mcd.CodigoMoneda = 'NIO' THEN mcd.Monto ELSE 0 END), 0) AS EgresoNio,
                ISNULL(SUM(CASE WHEN mc.EsIngreso = 0 AND mcd.CodigoMoneda = 'USD' THEN mcd.Monto ELSE 0 END), 0) AS EgresoUsd,
                COUNT(DISTINCT mc.IdMovimiento) AS TotalMovimientos
            FROM CAJA.MovimientoCaja mc
            INNER JOIN CAJA.MovimientoCajaDetalle mcd ON mcd.IdMovimientoCaja = mc.IdMovimiento
            INNER JOIN CAJA.AperturaCierreCaja ac ON ac.IdApertura = mc.IdAperturaCaja
            WHERE mc.Eliminado = 0
              AND CAST(mc.Fecha AS DATE) = ${fecha}
              ${filtroSucursal}
        `.toQuery());

        // Ventas del día
        const ventasDiaResult = await AppDataSource.query(...sql`
            SELECT
                COUNT(*) AS TotalVentas,
                ISNULL(SUM(v.Total), 0) AS MontoVentas
            FROM VENTAS.Venta v
            INNER JOIN INVENTARIO.Bodega b ON b.IdBodega = v.IdBodega
            WHERE v.Eliminado = 0
              AND CAST(v.Fecha AS DATE) = ${fecha}
              ${idSucursal ? sql`AND b.IdSucursal = ${parseInt(idSucursal as string, 10)}` : sql``}
        `.toQuery());

        return res.status(200).json({
            success: true,
            message: 'Reporte de cierre diario generado correctamente',
            data: {
                fecha,
                movimientos: toCamelCase(movimientosResult[0] || {}),
                ventas: toCamelCase(ventasDiaResult[0] || {}),
            },
        });
    } catch (error) {
        console.error('Error al generar cierre diario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar cierre diario',
        });
    }
};
