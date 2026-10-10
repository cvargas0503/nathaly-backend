import { Router } from 'express';
import { crearUsuario, eliminarUsuario, getEmpleadosConUsuario, getEmpleadosSinUsuario, getUsuariosEmpleado, modificarUsuario } from './usuario.controller';
import { authMiddleware } from '../../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getUsuariosEmpleado as any);
router.post('/', crearUsuario as any);
router.put('/:idUsuario', modificarUsuario as any);
router.delete('/:idUsuario', eliminarUsuario as any);
router.get('/empleados-sin-usuario', getEmpleadosSinUsuario as any);
router.get('/empleados-con-usuario', getEmpleadosConUsuario as any);


export default router;
