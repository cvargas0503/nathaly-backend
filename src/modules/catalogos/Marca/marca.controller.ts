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


import { catalogHandlers } from '../../auditoria/services/catalog-events';
const handlers = catalogHandlers(Marca, 'idMarca', 'marcas', 'Marca', 50);
export const createMarca = handlers.create;
export const updateMarca = handlers.update;
export const deleteMarcas = handlers.delete;
