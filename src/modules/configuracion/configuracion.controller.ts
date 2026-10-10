import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { TasaCambio } from '../admin/entities/TasaCambio';

/**
 * GET /configuracion/tasa-cambio
 * Retorna la tasa de cambio activa actual USDâ†’NIO
 */
export const obtenerTasaCambio = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Intentar obtener de la tabla TasaCambio
        try {
            const repo = AppDataSource.getRepository(TasaCambio);
            const tasa = await repo.findOne({
                where: { activa: true },
                order: { fechaVigencia: 'DESC' },
            });

            if (tasa) {
                return res.status(200).json({
                    success: true,
                    message: 'Tasa de cambio obtenida correctamente',
                    data: {
                        idTasa: tasa.idTasa,
                        valor: parseFloat(tasa.valor as any),
                        fechaVigencia: tasa.fechaVigencia,
                    },
                });
            }
        } catch {
            // La tabla no existe aÃºn, usar valor por defecto
        }

        // Fallback: valor por defecto
        return res.status(200).json({
            success: true,
            message: 'Tasa de cambio por defecto',
            data: {
                idTasa: null,
                valor: 37.00,
                fechaVigencia: new Date(),
            },
        });
    } catch (error) {
        console.error('Error al obtener tasa de cambio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tasa de cambio',
        });
    }
};

/**
 * PUT /configuracion/tasa-cambio
 * Actualiza la tasa de cambio. Body: { valor: 36.85 }
 */
export const actualizarTasaCambio = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { valor } = req.body;
        const creadoPor = req.user?.id;

        if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El valor de la tasa de cambio es requerido y debe ser un nÃºmero positivo.',
            });
        }

        if (!creadoPor) return res.status(401).json({ success: false, message: 'No autenticado.' });

        // Schema changes belong to migrations, never to an HTTP request.
        const guardada = await AppDataSource.transaction('SERIALIZABLE', async manager => {
            const repo = manager.getRepository(TasaCambio);
            await repo.update({ activa: true }, { activa: false });
            return repo.save(repo.create({
                valor: Number(valor), fechaVigencia: new Date(), activa: true, creadoPor,
            }));
        });
        return res.status(200).json({
            success: true,
            message: 'Tasa de cambio actualizada correctamente',
            data: { idTasa: guardada.idTasa, valor: Number(guardada.valor), fechaVigencia: guardada.fechaVigencia },
        });
    } catch (error) {
        console.error('Error al actualizar tasa de cambio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar tasa de cambio',
        });
    }
};
