import { Router } from 'express';
import { obtenerResumen, obtenerActividadReciente } from './dashboard.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/dashboard/resumen
router.get('/resumen', obtenerResumen as any);

// GET /api/v1/dashboard/actividad-reciente
router.get('/actividad-reciente', obtenerActividadReciente as any);

export default router;
