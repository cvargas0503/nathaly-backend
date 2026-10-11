import { Router } from 'express';
import { login, logout, profile } from './auth.controller';
import { validateLoginInput, authMiddleware } from './auth.middleware';

const router = Router();
router.post('/login', validateLoginInput, login);
router.post('/logout', logout);
router.get('/profile', authMiddleware as any, profile)

export default router;
