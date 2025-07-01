import { Router } from 'express';
import { convertirPedido, eliminarPedido, insertarPedido, obtenerTodosLosPedidos } from './pedido.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.post('/', insertarPedido as any);
router.get('/', obtenerTodosLosPedidos as any);
router.delete('/:idPedido', eliminarPedido as any);
router.patch('/:idPedido', convertirPedido as any);




export default router;