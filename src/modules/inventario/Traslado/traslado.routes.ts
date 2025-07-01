import { Router } from 'express';
import { insertarTraslado, obtenerTodosLosTraslados } from './traslado.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.post('/', insertarTraslado as any);
router.get('/', obtenerTodosLosTraslados as any);


export default router;