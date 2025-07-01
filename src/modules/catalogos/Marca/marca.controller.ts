import { Request, Response } from 'express';
import { In, QueryFailedError } from 'typeorm';
import { Marca } from '../entities/Marca';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppDataSource } from '../../../../ormconfig';
import { MarcaDTO } from '../dto/MarcaDTO';

function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export const getMarcas = async (req: Request, res: Response) => {
        try {
            const { page, limit, skip } = getPaginationParams(req);
            const marcaRepo = AppDataSource.getRepository(Marca);

            const [marcas, total] = await marcaRepo.findAndCount({
                where: { eliminado: false },
                skip,
                take: limit,
                order: { idMarca: 'ASC' },
            });

            res.json({
                data: marcas,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                success: true,
                message: 'Marcas obtenidas exitosamente',
            });
        } catch (error) {
            console.error('Error al obtener las marcas:', error);
            res.status(500).json({ message: 'Error al obtener las marcas', success: false });
        }
    };

export const getMarca = async (req: Request, res: Response)  : Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const marcaRepo = AppDataSource.getRepository(Marca);
            const marca = await marcaRepo.findOne({ where: { idMarca: id } });

            if (!marca) {
                res.status(404).json({ message: 'Marca no encontrada' });
                return
            }

            res.json(marca);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener la marca', error });
            return;
        }
    };

export const createMarca = async (
    req: AuthenticatedRequest,
    res: Response
) : Promise<Response> =>{
    try {
        const marcaRepo = AppDataSource.getRepository(Marca);
        const data = Object.assign(new MarcaDTO(), req.body);

        const existingMarca = await marcaRepo.findOne({ where: { nombre: data.nombre } });
        if (existingMarca) {
            return res.status(400).json({ message: 'Ya existe una marca con ese nombre', success: false });
        }

        data.nombre = data.nombre.toUpperCase();
        data.fechaCreacion = new Date();
        data.creadoPor = req.user?.id;

        const nuevaMarca = marcaRepo.create(data);
        const savedMarca = await marcaRepo.save(nuevaMarca);
        console.log('Marca creada:', savedMarca);

        return res.status(201).json({ message: 'Marca creada exitosamente', success: true, data: savedMarca });
    } catch (error) {
        if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Marca_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una marca con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_MARCA_NAME'
            });
        }
    }
        return res.status(500).json({ message: 'Error al crear la marca', error });
    }
};


export const updateMarca = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const marcaRepo = AppDataSource.getRepository(Marca);
            let marca = await marcaRepo.findOne({ where: { idMarca: id } });

            if (!marca) {
                return res.status(404).json({ message: 'Marca no encontrada' });
            }
            const data = Object.assign(new MarcaDTO(), req.body);
            data.modificadoPor = req.user?.id;
            data.fechaModificacion = new Date();
            marcaRepo.merge(marca, data);
            const updatedMarca = await marcaRepo.save(marca);
            res.status(200).json({message: 'Marca actualizada exitosamente', success: true, data: updatedMarca});
        } catch (error) {
            if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Marca_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una marca con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_MARCA_NAME'
            });
        }
        }
    };
}

export const deleteMarcas = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos una marca', success: false });
      return;
    }

    const marcaRepo = AppDataSource.getRepository(Marca);
    const marcas = await marcaRepo.findBy({idMarca: In(ids), eliminado: false});
    if (marcas.length === 0) {
      res.status(404).json({ message: 'No se encontraron las marcas proporcionadas', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const marcasActualizadas = marcas.map(marca => {
      marca.eliminado = true;
      marca.eliminadoPor = usuarioId;
      marca.fechaEliminacion = fecha;
      return marca;
    });

    await marcaRepo.save(marcasActualizadas);

    res.status(200).json({
      message: 'Marcas eliminadas exitosamente',
      count: marcasActualizadas.length,
      success: true
    });
  } catch (error: unknown) {
    console.error("Error al eliminar las marcas:", error);
    res.status(400).json({
      message: 'Error al eliminar las marcas',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};
