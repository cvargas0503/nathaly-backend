import { Router } from 'express';
import { getEmpleados, getEmpleado, createEmpleado, deleteEmpleados, updateEmpleado } from './empleado.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getEmpleados);

// Obtener una línea individual por ID
router.get('/:id', getEmpleado as any);

// Crear una nueva línea
router.post('/', createEmpleado as any);
router.put('/:id', updateEmpleado as any);


// Eliminar una línea por ID
router.delete('/', deleteEmpleados);

export default router;