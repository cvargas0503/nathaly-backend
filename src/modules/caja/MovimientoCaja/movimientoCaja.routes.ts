import { Router } from 'express';
import { obtenerMovimientosCaja, pagarVenta, registrarMovimiento } from './movimientoCaja.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.post('/movimiento-caja/pago/:idVenta', pagarVenta as any);
router.get('/movimiento-caja', obtenerMovimientosCaja as any);
router.post('/movimiento-caja', registrarMovimiento as any);



// // Obtener una línea individual por ID
// router.get('/:id', getCliente as any);

// // Crear una nueva línea
// router.post('/', createCliente as any);
// router.put('/:id', updateCliente as any);


// // Eliminar una línea por ID
// router.delete('/', deleteClientes);

export default router;