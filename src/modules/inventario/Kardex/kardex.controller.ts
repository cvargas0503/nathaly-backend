import { Request, Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { toCamelCase } from "../../../helpers";

export const getKardexGeneral = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const kardex: any[] = await AppDataSource.query('EXEC INVENTARIO.sp_Kardex_General');
    const kardexProcesado = toCamelCase(kardex);
    return res.status(200).json({
      success: true,
      message: 'Kardex general obtenido correctamente',
      data: {
        kardex: kardexProcesado
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del kardex:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del kardex',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
export const getKardexDetallado = async (_req: Request, res: Response): Promise<Response> => {
  try {
    console.log(_req.query);
    console.log('Obteniendo kardex detallado');
    const { idProducto, idBodega }= _req.query;
    if (!idProducto || !idBodega) {
      return res.status(400).json({ message: 'ID de producto y bodega son requeridos', success: false });
    }
    if (isNaN(Number(idProducto)) || isNaN(Number(idBodega))) {
      return res.status(400).json({ message: 'ID de producto y bodega deben ser numéricos', success: false });
    }
    const movimientos: any[] = await AppDataSource.query('EXEC INVENTARIO.vw_KardexDetallado @IdProducto = @0, @IdBodega = @1', [idProducto, idBodega]);
    const movimientosProcesado = toCamelCase(movimientos);
    return res.status(200).json({
      success: true,
      message: 'Kardex general obtenido correctamente',
      data: {
        movimientos: movimientosProcesado
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del kardex:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del kardex',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};