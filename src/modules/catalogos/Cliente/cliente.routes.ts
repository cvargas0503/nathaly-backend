import { Router } from 'express';
import { getClientes, getCliente, createCliente, deleteClientes, updateCliente } from './cliente.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getClientes);

// Obtener una línea individual por ID
router.get('/:id', getCliente as any);

// Crear una nueva línea
router.post('/', createCliente as any);
router.put('/:id', updateCliente as any);


// Eliminar una línea por ID
router.delete('/', deleteClientes);

export default router;