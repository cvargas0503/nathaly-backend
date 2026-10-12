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


import { catalogHandlers } from '../../auditoria/services/catalog-events';
const handlers = catalogHandlers(Linea, 'idLinea', 'lineas', 'Línea', 50);
export const createLinea = handlers.create;
export const updateLinea = handlers.update;
export const deleteLineas = handlers.delete;
