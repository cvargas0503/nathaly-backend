import { Router } from 'express';
import { obtenerNotificaciones, marcarComoLeida, alertasStock } from './notificaciones.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/notificaciones
router.get('/', obtenerNotificaciones as any);

// PATCH /api/v1/notificaciones/:id/leer
router.patch('/:id/leer', marcarComoLeida as any);

// GET /api/v1/notificaciones/alertas-stock?umbral={min}
router.get('/alertas-stock', alertasStock as any);

export default router;
