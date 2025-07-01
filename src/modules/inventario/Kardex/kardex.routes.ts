import { Router } from 'express';
import { getKardexDetallado, getKardexGeneral } from './kardex.controller';
const router = Router()
router.get('/kardex-general', getKardexGeneral as any);
router.get('/movimientos-producto', getKardexDetallado as any);

export default router