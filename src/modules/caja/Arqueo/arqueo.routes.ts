import { Router } from 'express';
import { cargarArqueo, getDatosArqueoInicio, guardarArqueo  } from './arqueo.controller';
import { authMiddleware } from '../../auth/auth.middleware';
const router = Router()
router.use(authMiddleware as any);
router.get('/datos-apertura-arqueo', getDatosArqueoInicio as any);
router.get('/', cargarArqueo as any);
router.post('/arqueo', guardarArqueo as any);





export default router