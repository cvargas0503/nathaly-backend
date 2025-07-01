import { Router } from 'express';
import { getListaPrecios, getListaPrecio, createListaPrecio, deleteListaPrecios, updateListaPrecio } from './precio.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getListaPrecios);

// Obtener una línea individual por ID
router.get('/:id', getListaPrecio);

// Crear una nueva línea
router.post('/', createListaPrecio as any);
router.put('/:id', updateListaPrecio as any);


// Eliminar una línea por ID
router.delete('/', deleteListaPrecios);

export default router;