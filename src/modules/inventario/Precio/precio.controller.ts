import { Request, Response } from 'express';
import { In, QueryFailedError } from 'typeorm';
import { ListaPrecio } from '../entities/ListaPrecio';
import { ListaPrecioDTO } from '../dto/ListaPrecioDTO';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppDataSource } from '../../../../ormconfig';

function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export const getListaPrecios = async (req: Request, res: Response) => {
        try {
            const { page, limit, skip } = getPaginationParams(req);
            console.log(`Obteniendo listaPrecios - Página: ${page}, Límite: ${limit}, Omitir: ${skip}`);
            const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);

            const [listaPrecios, total] = await listaPrecioRepo.findAndCount({
                where: { eliminado: false },
                skip,
                take: limit,
                order: { idListaPrecio: 'ASC' },
            });

            res.json({
                data: listaPrecios,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                success: true,
                message: 'ListaPrecios obtenidas exitosamente',
            });
        } catch (error) {
            console.error('Error al obtener las listaPrecios:', error);
            res.status(500).json({ message: 'Error al obtener las listaPrecios', success: false });
        }
    };

export const getListaPrecio = async (req: Request, res: Response)  : Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);
            const listaPrecio = await listaPrecioRepo.findOne({ where: { idListaPrecio: id } });

            if (!listaPrecio) {
                res.status(404).json({ message: 'ListaPrecio no encontrada' });
                return
            }

            res.json(listaPrecio);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener la listaPrecio', error });
            return;
        }
    };

export const createListaPrecio = async (
    req: AuthenticatedRequest,
    res: Response
) : Promise<Response> =>{
    try {
        const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);
        const data = Object.assign(new ListaPrecioDTO(), req.body);

        const existingListaPrecio = await listaPrecioRepo.findOne({ where: { nombre: data.nombre } });
        if (existingListaPrecio) {
            return res.status(400).json({ message: 'Ya existe una listaPrecio con ese nombre', success: false });
        }

        data.nombre = data.nombre.toUpperCase();
        data.fechaCreacion = new Date();
        data.creadoPor = req.user?.id;

        const nuevaListaPrecio = listaPrecioRepo.create(data);
        const savedListaPrecio = await listaPrecioRepo.save(nuevaListaPrecio);
        console.log('ListaPrecio creada:', savedListaPrecio);

        return res.status(201).json({ message: 'ListaPrecio creada exitosamente', success: true, data: savedListaPrecio });
    } catch (error) {
        if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__ListaPrecio__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la listaPrecio no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_listaPrecio_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_ListaPrecio_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una listaPrecio con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_listaPrecio_NAME'
            });
        }
    }
        return res.status(500).json({ message: 'Error al crear la listaPrecio', error });
    }
};


export const updateListaPrecio = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);
            let listaPrecio = await listaPrecioRepo.findOne({ where: { idListaPrecio: id } });

            if (!listaPrecio) {
                return res.status(404).json({ message: 'ListaPrecio no encontrada' });
            }
            const data = Object.assign(new ListaPrecioDTO(), req.body);
            data.modificadoPor = req.user?.id;
            data.fechaModificacion = new Date();
            listaPrecioRepo.merge(listaPrecio, data);
            const updatedListaPrecio = await listaPrecioRepo.save(listaPrecio);
            res.status(200).json({message: 'ListaPrecio actualizada exitosamente', success: true, data: updatedListaPrecio});
        } catch (error) {
            if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__ListaPrecio__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la listaPrecio no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_listaPrecio_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_ListaPrecio_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una listaPrecio con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_listaPrecio_NAME'
            });
        }
        }
    };
}

export const deleteListaPrecios = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log(req)
    console.log("Eliminando listaPrecios:", req.body);
    const { ids } = req.body;
    console.log("IDs de listaPrecios a eliminar:", ids);
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos una listaPrecio', success: false });
      return;
    }

    const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);
    const listaPrecios = await listaPrecioRepo.findBy({idListaPrecio: In(ids), eliminado: false});
    console.log("ListaPrecios encontradas:", listaPrecios);

    if (listaPrecios.length === 0) {
      res.status(404).json({ message: 'No se encontraron las listaPrecios proporcionadas', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const listaPreciosActualizadas = listaPrecios.map(listaPrecio => {
      listaPrecio.eliminado = true;
      listaPrecio.eliminadoPor = usuarioId;
      listaPrecio.fechaEliminacion = fecha;
      return listaPrecio;
    });

    await listaPrecioRepo.save(listaPreciosActualizadas);

    res.status(200).json({
      message: 'Lista de precios eliminadas exitosamente',
      count: listaPreciosActualizadas.length,
      success: true
    });
  } catch (error: unknown) {
    console.error("Error al eliminar listaPrecios:", error);
    res.status(400).json({
      message: 'Error al eliminar las listaPrecios',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};
