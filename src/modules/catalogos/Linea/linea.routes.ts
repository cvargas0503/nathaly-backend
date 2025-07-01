import { Router } from 'express';
import { getLineas, getLinea, createLinea, deleteLineas, updateLinea } from './linea.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getLineas);

// Obtener una línea individual por ID
router.get('/:id', getLinea);

// Crear una nueva línea
router.post('/', createLinea as any);
router.put('/:id', updateLinea as any);


// Eliminar una línea por ID
router.delete('/', deleteLineas);

export default router;