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


import { catalogHandlers } from '../../auditoria/services/catalog-events';
const handlers = catalogHandlers(Categoria, 'idCategoria', 'categorias', 'Categoria', 50);
export const createCategoria = handlers.create;
export const updateCategoria = handlers.update;
export const deleteCategorias = handlers.delete;
