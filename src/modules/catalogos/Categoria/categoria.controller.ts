import { Request, Response } from 'express';
import { In, QueryFailedError } from 'typeorm';
import { Categoria } from '../entities/Categoria';
import { CategoriaDTO } from '../dto/CategoriaDTO';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppDataSource } from '../../../../ormconfig';

function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export const getCategorias = async (req: Request, res: Response) => {
        try {
            const { page, limit, skip } = getPaginationParams(req);
            console.log(`Obteniendo categorias - Página: ${page}, Límite: ${limit}, Omitir: ${skip}`);
            const categoriaRepo = AppDataSource.getRepository(Categoria);

            const [categorias, total] = await categoriaRepo.findAndCount({
                where: { eliminado: false },
                skip,
                take: limit,
                order: { idCategoria: 'ASC' },
            });

            res.json({
                data: categorias,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                success: true,
                message: 'Categorias obtenidas exitosamente',
            });
        } catch (error) {
            console.error('Error al obtener las categorias:', error);
            res.status(500).json({ message: 'Error al obtener las categorias', success: false });
        }
    };

export const getCategoria = async (req: Request, res: Response)  : Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const categoriaRepo = AppDataSource.getRepository(Categoria);
            const categoria = await categoriaRepo.findOne({ where: { idCategoria: id } });

            if (!categoria) {
                res.status(404).json({ message: 'Categoria no encontrada' });
                return
            }

            res.json(categoria);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener la categoria', error });
            return;
        }
    };

export const createCategoria = async (
    req: AuthenticatedRequest,
    res: Response
) : Promise<Response> =>{
    try {
        const categoriaRepo = AppDataSource.getRepository(Categoria);
        const data = Object.assign(new CategoriaDTO(), req.body);

        const existingCategoria = await categoriaRepo.findOne({ where: { nombre: data.nombre } });
        if (existingCategoria) {
            return res.status(400).json({ message: 'Ya existe una categoria con ese nombre', success: false });
        }

        data.nombre = data.nombre.toUpperCase();
        data.fechaCreacion = new Date();
        data.creadoPor = req.user?.id;

        const nuevaCategoria = categoriaRepo.create(data);
        const savedCategoria = await categoriaRepo.save(nuevaCategoria);
        console.log('Categoria creada:', savedCategoria);

        return res.status(201).json({ message: 'Categoria creada exitosamente', success: true, data: savedCategoria });
    } catch (error) {
        if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Categoria__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la categoria no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_CATEGORIA_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Categoria_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una categoria con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_CATEGORIA_NAME'
            });
        }
    }
        return res.status(500).json({ message: 'Error al crear la categoria', error });
    }
};


export const updateCategoria = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const categoriaRepo = AppDataSource.getRepository(Categoria);
            let categoria = await categoriaRepo.findOne({ where: { idCategoria: id } });

            if (!categoria) {
                return res.status(404).json({ message: 'Categoria no encontrada' });
            }
            const data = Object.assign(new CategoriaDTO(), req.body);
            data.modificadoPor = req.user?.id;
            data.fechaModificacion = new Date();
            categoriaRepo.merge(categoria, data);
            const updatedCategoria = await categoriaRepo.save(categoria);
            res.status(200).json({message: 'Categoria actualizada exitosamente', success: true, data: updatedCategoria});
        } catch (error) {
            if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Categoria__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la categoria no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_CATEGORIA_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Categoria_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una categoria con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_CATEGORIA_NAME'
            });
        }
        }
    };
}

export const deleteCategorias = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log(req)
    console.log("Eliminando categorias:", req.body);
    const { ids } = req.body;
    console.log("IDs de categorias a eliminar:", ids);
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos una categoria', success: false });
      return;
    }

    const categoriaRepo = AppDataSource.getRepository(Categoria);
    const categorias = await categoriaRepo.findBy({idCategoria: In(ids), eliminado: false});
    console.log("Categorias encontradas:", categorias);

    if (categorias.length === 0) {
      res.status(404).json({ message: 'No se encontraron las categorias proporcionadas', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const categoriasActualizadas = categorias.map(categoria => {
      categoria.eliminado = true;
      categoria.eliminadoPor = usuarioId;
      categoria.fechaEliminacion = fecha;
      return categoria;
    });

    await categoriaRepo.save(categoriasActualizadas);

    res.status(200).json({
      message: 'Categorias eliminadas exitosamente',
      count: categoriasActualizadas.length,
      success: true
    });
  } catch (error: unknown) {
    console.error("Error al eliminar categorias:", error);
    res.status(400).json({
      message: 'Error al eliminar las categorias',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};
