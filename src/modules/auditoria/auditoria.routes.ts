import { Router } from 'express';
import { obtenerAuditoria } from './auditoria.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/auditoria?entidad={tipo}&desde={fecha}&hasta={fecha}
router.get('/', obtenerAuditoria as any);

export default router;
