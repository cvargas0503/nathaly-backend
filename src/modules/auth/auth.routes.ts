import { Router } from 'express';
import { login, profile } from './auth.controller';
import { errorHandler, validateLoginInput } from './auth.middleware';

const router = Router();
router.post('/login', validateLoginInput, login);
router.get('/profile', profile)

export default router;