import { Router } from 'express';
import { asignarPermisos, obtenerPermisosPorUsuario, revocarPermisos } from './permiso.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/empleado/:idEmpleado', obtenerPermisosPorUsuario as any);

// Obtener una línea individual por ID
router.post('/asignar-permisos', asignarPermisos as any);

// Crear una nueva línea
router.post('/revocar-permisos', revocarPermisos as any);


export default router;