import { Router } from 'express';
import { insertarCompra, obtenerTodasLasCompras } from './compra.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.post('/', insertarCompra as any);
router.get('/', obtenerTodasLasCompras as any);


export default router;