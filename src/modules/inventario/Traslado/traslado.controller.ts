import { Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import sql from 'mssql';
import { getMSSQLPool } from '../../../database';
import { toCamelCase } from '../../../helpers';
export const insertarTraslado = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let {
            bodegaOrigen,
            bodegaDestino,
            observacion,
            fecha,
            productos // Array de objetos: [{ idProducto, cantidad, precioUnitario }]
        } = req.body;

        // Sanitización: convertir strings a enteros/fechas válidas
        bodegaOrigen = parseInt(bodegaOrigen, 10);
        bodegaDestino = parseInt(bodegaDestino, 10);

        // Validaciones básicas
        if (isNaN(bodegaOrigen) || bodegaOrigen <= 0) {
            return res.status(400).json({ message: 'El id del cliente es requerido y debe ser numérico.' });
        }
        if (isNaN(bodegaDestino) || bodegaDestino <= 0) {
            return res.status(400).json({ message: 'El id del empleado es requerido y debe ser numérico.' });
        }

        if (!fecha || isNaN(Date.parse(fecha))) {
            return res.status(400).json({ message: 'La fecha es requerida y debe ser válida.' });
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ message: 'El detalle es requerido y debe ser un arreglo no vacío.' });
        }

        for (const detalle of productos) {
            const idProducto = parseInt(detalle.idProducto, 10);
            const cantidad = parseFloat(detalle.cantidad);
            if (
                isNaN(idProducto) || idProducto <= 0 ||
                isNaN(cantidad) || cantidad <= 0
            ) {
                return res.status(400).json({
                    message: 'Cada detalle debe tener un producto y cantidad válidos.'
                });
            }

            // Asegura los tipos correctos
            detalle.idProducto = idProducto;
            detalle.cantidad = cantidad;
        }

        // Llamada al procedimiento almacenado
        const usuarioId = req.user?.id ?? null;

       const pool = await getMSSQLPool();

    // Construir TVP
    const tvp = new sql.Table('INVENTARIO.TipoTrasladoDetalle');
    tvp.columns.add('IdProducto', sql.Int);
    tvp.columns.add('Cantidad', sql.Decimal(18, 4));

    for (const item of productos) {
      tvp.rows.add(
        parseInt(item.idProducto, 10),
        parseFloat(item.cantidad),
      );
    }

    // Ejecutar procedimiento
    const respuesta = await pool.request()
      .input('IdBodegaOrigen', sql.Int, bodegaOrigen)
      .input('IdBodegaDestino', sql.Int, bodegaDestino)
      .input('Fecha', sql.DateTime2, new Date(fecha))
      .input('UsuarioId', sql.Int, usuarioId)
      .input('Observacion', sql.NVarChar(250), "")
      .input('Detalles', tvp)
      .execute('INVENTARIO.sp_Traslado_Insertar');
      const IdTraslado = respuesta.recordset[0]?.IdTraslado;
    //   console.log('ID de la venta insertada:', idVenta);
    //   const result = await pool.request()
    //   .input('IdVenta', sql.BigInt, idVenta)
    //   .execute('REPORTES.sp_Reporte_Venta');

    //   console.log('Resultado de la consulta de venta:', result);


    //   const factura  = result.recordset[0] || null;
    //   const data = toCamelCase(factura);
    return res.status(201).json({ message: 'Venta insertada correctamente.', success: true });

    } catch (error: any) {
        console.log('Error al insertar la venta:', error);
        if (error?.number === 50001 || error?.number === 50002) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error al insertar la venta.' });
    }
};
export const obtenerTodosLosTraslados = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await AppDataSource.query('EXEC REPORTES.sp_Reporte_TodosLosTraslado');
        let traslados = result || [];

        traslados = traslados.map((traslado: any) => {
            // Convertir detalles de string JSON a objeto
            if (traslado.Detalles && typeof traslado.Detalles === 'string') {
                try {
                    traslado.Detalles = JSON.parse(traslado.Detalles);
                } catch {
                    traslado.Detalles = [];
                }
            }
            return toCamelCase(traslado);
        });

        return res.status(200).json({"message": "Traslados obtenidos correctamente", "data": traslados, "success": true});
    } catch (error) {
        console.error('Error al obtener los traslados:', error);
        return res.status(500).json({ message: 'Error al obtener los traslados.' });
    }
};