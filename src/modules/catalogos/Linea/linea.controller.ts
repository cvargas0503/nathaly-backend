import { Request, Response } from 'express';
import {In, QueryFailedError } from 'typeorm';
import { Linea } from '../entities/Linea';
import { LineaDTO } from '../dto/LineaDTO';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppDataSource } from '../../../../ormconfig';

function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export const getLineas = async (req: Request, res: Response) => {
        try {
            const { page, limit, skip } = getPaginationParams(req);
            console.log(`Obteniendo líneas - Página: ${page}, Límite: ${limit}, Omitir: ${skip}`);
            const lineaRepo = AppDataSource.getRepository(Linea);

            const [lineas, total] = await lineaRepo.findAndCount({
                where: { eliminado: false },
                skip,
                take: limit,
                order: { idLinea: 'ASC' },
            });

            res.json({
                data: lineas,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                success: true,
                message: 'Líneas obtenidas exitosamente',
            });
        } catch (error) {
            console.error('Error al obtener las líneas:', error);
            res.status(500).json({ message: 'Error al obtener las líneas', success: false });
        }
    };

export const getLinea = async (req: Request, res: Response)  : Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const lineaRepo = AppDataSource.getRepository(Linea);
            const linea = await lineaRepo.findOne({ where: { idLinea: id } });

            if (!linea) {
                res.status(404).json({ message: 'Línea no encontrada' });
                return
            }

            res.json(linea);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener la línea', error });
            return;
        }
    };

export const createLinea = async (
    req: AuthenticatedRequest,
    res: Response
) : Promise<Response> =>{
    try {
        const lineaRepo = AppDataSource.getRepository(Linea);
        const data = Object.assign(new LineaDTO(), req.body);

        const existingLinea = await lineaRepo.findOne({ where: { nombre: data.nombre } });
        if (existingLinea) {
            return res.status(400).json({ message: 'Ya existe una línea con ese nombre', success: false });
        }

        data.nombre = data.nombre.toUpperCase();
        data.fechaCreacion = new Date();
        data.creadoPor = req.user?.id;

        const nuevaLinea = lineaRepo.create(data);
        const savedLinea = await lineaRepo.save(nuevaLinea);
        console.log('Línea creada:', savedLinea);

        return res.status(201).json({ message: 'Línea creada exitosamente', success: true, data: savedLinea });
    } catch (error) {
        if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Linea__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la línea no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_LINEA_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Linea_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una línea con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_LINEA_NAME'
            });
        }
    }
        return res.status(500).json({ message: 'Error al crear la línea', error });
    }
};


export const updateLinea = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const lineaRepo = AppDataSource.getRepository(Linea);
            let linea = await lineaRepo.findOne({ where: { idLinea: id } });

            if (!linea) {
                return res.status(404).json({ message: 'Línea no encontrada' });
            }
            const data = Object.assign(new LineaDTO(), req.body);
            data.modificadoPor = req.user?.id;
            data.fechaModificacion = new Date();
            lineaRepo.merge(linea, data);
            const updatedLinea = await lineaRepo.save(linea);
            res.status(200).json({message: 'Línea actualizada exitosamente', success: true, data: updatedLinea});
        } catch (error) {
            if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Linea__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la línea no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_LINEA_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Linea_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una línea con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_LINEA_NAME'
            });
        }
        }
    };
}

export const deleteLineas = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log(req)
    console.log("Eliminando líneas:", req.body);
    const { ids } = req.body;
    console.log("IDs de líneas a eliminar:", ids);
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos una linea', success: false });
      return;
    }

    const lineaRepo = AppDataSource.getRepository(Linea);
    const lineas = await lineaRepo.findBy({idLinea: In(ids), eliminado: false});
    console.log("Líneas encontradas:", lineas);

    if (lineas.length === 0) {
      res.status(404).json({ message: 'No se encontraron las líneas proporcionadas', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const lineasActualizadas = lineas.map(linea => {
      linea.eliminado = true;
      linea.eliminadoPor = usuarioId;
      linea.fechaEliminacion = fecha;
      return linea;
    });

    await lineaRepo.save(lineasActualizadas);

    res.status(200).json({
      message: 'Líneas eliminadas exitosamente',
      count: lineasActualizadas.length,
      success: true
    });
  } catch (error: unknown) {
    console.error("Error al eliminar líneas:", error);
    res.status(400).json({
      message: 'Error al eliminar las líneas',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};
