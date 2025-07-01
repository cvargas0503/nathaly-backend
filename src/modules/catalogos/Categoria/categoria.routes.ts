import { Router } from 'express';
import { getCategorias, getCategoria, createCategoria, deleteCategorias, updateCategoria } from './categoria.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getCategorias);

// Obtener una línea individual por ID
router.get('/:id', getCategoria);

// Crear una nueva línea
router.post('/', createCategoria as any);
router.put('/:id', updateCategoria as any);


// Eliminar una línea por ID
router.delete('/', deleteCategorias);

export default router;