import { Router } from 'express';
// import { getProductos, getProducto, createProducto, deleteProductos, updateProducto } from './producto.controller';
import { createProducto, deleteProductos, getProductos, updateProducto } from './producto.controller';
import { authMiddleware } from '../../auth/auth.middleware';
import { uploadRutaDinamica } from '../../middlewares/upload.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getProductos as any);

// Obtener una línea individual por ID
// router.get('/:id', getProducto);

// Crear una nueva línea
router.post('/', uploadRutaDinamica, createProducto as any);
router.put('/:id', updateProducto as any);


// Eliminar una línea por ID
router.delete('/', deleteProductos as any);

export default router;
