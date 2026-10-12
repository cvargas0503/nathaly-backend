import { Router } from 'express';
import { getMarcas, getMarca, createMarca, deleteMarcas, updateMarca } from './marca.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getMarcas);

// Obtener una marca individual por ID
router.get('/:id', getMarca);

// Crear una nueva marca
router.post('/', createMarca as any);
router.put('/:id', updateMarca as any);


// Eliminar una marca por ID
router.delete('/', deleteMarcas as any);

export default router;
