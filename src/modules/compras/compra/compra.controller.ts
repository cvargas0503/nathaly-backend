import { Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import sql from 'mssql';
import { getMSSQLPool } from '../../../database';
import { toCamelCase } from '../../../helpers';
export const insertarCompra = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let {
            idProveedor,
            idEmpleado,
            idBodega,
            fecha,
            productos // Array de objetos: [{ idProducto, cantidad, precioUnitario }]
        } = req.body;

        console.log("req.body:", req.body);
        // Sanitización: convertir strings a enteros/fechas válidas
        idProveedor = parseInt(idProveedor, 10);
        idEmpleado = parseInt(idEmpleado, 10);
        idBodega = parseInt(idBodega, 10);

        // Validaciones básicas
        if (isNaN(idProveedor) || idProveedor <= 0) {
            return res.status(400).json({ message: 'El id del proveedor es requerido y debe ser numérico.' });
        }
        if (isNaN(idEmpleado) || idEmpleado <= 0) {
            return res.status(400).json({ message: 'El id del empleado es requerido y debe ser numérico.' });
        }
        if (isNaN(idBodega) || idBodega <= 0) {
            return res.status(400).json({ message: 'El id de la bodega es requerido y debe ser numérico.' });
        }

        if (!fecha || isNaN(Date.parse(fecha))) {
            return res.status(400).json({ message: 'La fecha es requerida y debe ser válida.' });
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ message: 'El detalle de la compra es requerido y debe ser un arreglo no vacío.' });
        }

        for (const detalle of productos) {
            const idProducto = parseInt(detalle.idProducto, 10);
            const cantidad = parseFloat(detalle.cantidad);
            const costoUnit = parseFloat(detalle.costoUnit);

            if (
                isNaN(idProducto) || idProducto <= 0 ||
                isNaN(cantidad) || cantidad <= 0 ||
                isNaN(costoUnit) || costoUnit < 0
            ) {
                return res.status(400).json({
                    message: 'Cada detalle debe tener un producto, cantidad y precio válidos.'
                });
            }

            // Asegura los tipos correctos
            detalle.idProducto = idProducto;
            detalle.cantidad = cantidad;
            detalle.costoUnit = costoUnit;
            detalle.descuento = detalle.descuento ?? 0; // Agrega si falta
        }

        // Llamada al procedimiento almacenado
        const usuarioId = req.user?.id ?? null;

       const pool = await getMSSQLPool();

    // Construir TVP
    const tvp = new sql.Table('COMPRAS.TipoCompraDetalle');
    tvp.columns.add('IdProducto', sql.Int);
    tvp.columns.add('Cantidad', sql.Decimal(18, 4));
    tvp.columns.add('CostoUnit', sql.Decimal(18, 4));

    for (const item of productos) {
      tvp.rows.add(
        parseInt(item.idProducto, 10),
        parseFloat(item.cantidad),
        parseFloat(item.costoUnit),
      );
    }

    // Ejecutar procedimiento
    console.log("usuarioId:", usuarioId);
    console.log("idProveedor:", idProveedor);
    await pool.request()
      .input('IdProveedor', sql.Int, idProveedor)
      .input('IdEmpleado', sql.Int, idEmpleado)
      .input('IdBodega', sql.Int, idBodega)
      .input('Fecha', sql.DateTime2, new Date(fecha))
      .input('UsuarioId', sql.Int, usuarioId)
      .input('Detalles', tvp)
      .execute('COMPRAS.sp_Compra_Insertar');

      
    return res.status(201).json({ message: 'Compra insertada correctamente.', success: true });

    } catch (error: any) {
        console.log('Error al insertar la venta:', error);
        if (error?.number === 50001 || error?.number === 50002) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error al insertar la venta.' });
    }
};

export const obtenerTodasLasCompras = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await AppDataSource.query('EXEC REPORTES.sp_Reporte_TodasLasCompras');
        let compras = result || [];

        compras = compras.map((compra: any) => {
            // Convertir detalles de string JSON a objeto
            if (compra.Detalles && typeof compra.Detalles === 'string') {
                try {
                    compra.Detalles = JSON.parse(compra.Detalles);
                } catch {
                    compra.Detalles = [];
                }
            }
            return toCamelCase(compra);
        });

        return res.status(200).json({"message": "Ventas obtenidas correctamente", "data": compras, "success": true});
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        return res.status(500).json({ message: 'Error al obtener las ventas.' });
    }
};