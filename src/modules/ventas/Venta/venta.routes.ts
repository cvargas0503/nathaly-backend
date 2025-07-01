import { Router } from 'express';
import { eliminarVenta, insertarVenta, obtenerTodasLasVentas, obtenerVentasPendientesActivas } from './venta.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.post('/', insertarVenta as any);
router.get('/', obtenerTodasLasVentas as any);
router.get('/ventas-pendientes', obtenerVentasPendientesActivas as any);

router.delete('/:idVenta', eliminarVenta as any);



export default router;