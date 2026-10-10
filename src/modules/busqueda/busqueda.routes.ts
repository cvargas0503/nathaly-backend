import { Router } from 'express';
import { busquedaGlobal } from './busqueda.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/busqueda?q={termino}
router.get('/', busquedaGlobal as any);

export default router;
