import { Router } from 'express';
import { obtenerTasaCambio, actualizarTasaCambio } from './configuracion.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/configuracion/tasa-cambio
router.get('/tasa-cambio', obtenerTasaCambio as any);

// PUT /api/v1/configuracion/tasa-cambio
router.put('/tasa-cambio', actualizarTasaCambio as any);

export default router;
