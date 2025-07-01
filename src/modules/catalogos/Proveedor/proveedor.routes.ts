import { Router } from 'express';
import { getProveedores, getProveedor, createProveedor, deleteProveedores, updateProveedor } from './proveedor.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getProveedores);

// Obtener una línea individual por ID
router.get('/:id', getProveedor);

// Crear una nueva línea
router.post('/', createProveedor as any);
router.put('/:id', updateProveedor as any);


// Eliminar una línea por ID
router.delete('/', deleteProveedores);

export default router;