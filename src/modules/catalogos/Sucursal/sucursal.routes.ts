import { Router } from 'express';
// import { getProductos, getProducto, createProducto, deleteProductos, updateProducto } from './producto.controller';
import { actualizarSucursal, crearSucursal, eliminarSucursal } from './sucursal.controller';
import { authMiddleware } from '../../auth/auth.middleware';
import { uploadRutaDinamica } from '../../middlewares/upload.middleware';

const router = Router();

router.use(authMiddleware as any);
router.post('/', uploadRutaDinamica, crearSucursal as any);
router.put('/:idSucursal', uploadRutaDinamica, actualizarSucursal as any);
router.delete('/:idSucursal', eliminarSucursal as any);



export default router;