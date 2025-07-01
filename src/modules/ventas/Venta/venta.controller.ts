import { Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import sql from 'mssql';
import { getMSSQLPool } from '../../../database';
import { toCamelCase } from '../../../helpers';
export const insertarVenta = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let {
            idCliente,
            idEmpleado,
            idSucursal,
            idTermino,
            fecha,
            detalles // Array de objetos: [{ idProducto, cantidad, precioUnitario }]
        } = req.body;

        // Sanitización: convertir strings a enteros/fechas válidas
        idCliente = parseInt(idCliente, 10);
        idEmpleado = parseInt(idEmpleado, 10);
        idSucursal = parseInt(idSucursal, 10);
        idTermino = parseInt(idTermino, 10);

        // Validaciones básicas
        if (isNaN(idCliente) || idCliente <= 0) {
            return res.status(400).json({ message: 'El id del cliente es requerido y debe ser numérico.' });
        }
        if (isNaN(idEmpleado) || idEmpleado <= 0) {
            return res.status(400).json({ message: 'El id del empleado es requerido y debe ser numérico.' });
        }
        if (isNaN(idSucursal) || idSucursal <= 0) {
            return res.status(400).json({ message: 'El id de la sucursal es requerido y debe ser numérico.' });
        }
        if (isNaN(idTermino) || idTermino <= 0) {
            return res.status(400).json({ message: 'El id del término es requerido y debe ser numérico.' });
        }

        if (!fecha || isNaN(Date.parse(fecha))) {
            return res.status(400).json({ message: 'La fecha es requerida y debe ser válida.' });
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ message: 'El detalle es requerido y debe ser un arreglo no vacío.' });
        }

        for (const detalle of detalles) {
            const idProducto = parseInt(detalle.idProducto, 10);
            const cantidad = parseFloat(detalle.cantidad);
            const precioUnitario = parseFloat(detalle.precioUnitario);

            if (
                isNaN(idProducto) || idProducto <= 0 ||
                isNaN(cantidad) || cantidad <= 0 ||
                isNaN(precioUnitario) || precioUnitario < 0
            ) {
                return res.status(400).json({
                    message: 'Cada detalle debe tener un producto, cantidad y precio válidos.'
                });
            }

            // Asegura los tipos correctos
            detalle.idProducto = idProducto;
            detalle.cantidad = cantidad;
            detalle.precioUnitario = precioUnitario;
            detalle.descuento = detalle.descuento ?? 0; // Agrega si falta
        }

        // Llamada al procedimiento almacenado
        const usuarioId = req.user?.id ?? null;

       const pool = await getMSSQLPool();

    // Construir TVP
    const tvp = new sql.Table('VENTAS.TipoVentaDetalle');
    tvp.columns.add('IdProducto', sql.Int);
    tvp.columns.add('Cantidad', sql.Decimal(18, 4));
    tvp.columns.add('PrecioUnitario', sql.Decimal(18, 4));
    tvp.columns.add('Descuento', sql.Decimal(18, 4));

    for (const item of detalles) {
      tvp.rows.add(
        parseInt(item.idProducto, 10),
        parseFloat(item.cantidad),
        parseFloat(item.precioUnitario),
        item.descuento ?? 0
      );
    }

    // Ejecutar procedimiento
    console.log("usuarioId:", usuarioId);
    console.log("idCliente:", idCliente);
    const respuesta = await pool.request()
      .input('IdCliente', sql.Int, idCliente)
      .input('IdEmpleado', sql.Int, idEmpleado)
      .input('IdSucursal', sql.Int, idSucursal)
      .input('Fecha', sql.DateTime2, new Date(fecha))
      .input('IdTermino', sql.SmallInt, idTermino)
      .input('UsuarioId', sql.Int, usuarioId)
      .input('Observacion', sql.NVarChar(250), "")
      .input('Detalles', tvp)
      .execute('VENTAS.sp_Venta_Insertar_Optimizado');
      const idVenta = respuesta.recordset[0]?.IdVenta;
      console.log('ID de la venta insertada:', idVenta);
      const result = await pool.request()
      .input('IdVenta', sql.BigInt, idVenta)
      .execute('REPORTES.sp_Reporte_Venta');

      console.log('Resultado de la consulta de venta:', result);


      const factura  = result.recordset[0] || null;
      const data = toCamelCase(factura);
    return res.status(201).json({ message: 'Venta insertada correctamente.', data, success: true });

    } catch (error: any) {
        console.log('Error al insertar la venta:', error);
        if (error?.number === 50001 || error?.number === 50002) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error al insertar la venta.' });
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
