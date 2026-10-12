import { Router } from 'express';
import { disponibilidad, registrarDevolucion, listarDevoluciones, obtenerDevolucion } from './devoluciones.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// POST /api/v1/devoluciones
router.post('/', registrarDevolucion as any);

// GET /api/v1/devoluciones?desde={fecha}&hasta={fecha}
router.get('/', listarDevoluciones as any);

// GET /api/v1/devoluciones/:id
router.get('/ventas/:idVenta/disponibilidad', disponibilidad as any);
router.get('/:id', obtenerDevolucion as any);

export default router;
