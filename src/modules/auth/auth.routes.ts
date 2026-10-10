import { Router } from 'express';
import { login, logout, profile } from './auth.controller';
import { validateLoginInput } from './auth.middleware';

const router = Router();
router.post('/login', validateLoginInput, login);
router.post('/logout', logout);
router.get('/profile', profile)

export default router;
