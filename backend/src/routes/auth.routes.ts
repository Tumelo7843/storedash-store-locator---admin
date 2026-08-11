import { Router } from 'express';
import { getMe, syncProfile, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();
authRouter.post('/sync', requireAuth, syncProfile);
authRouter.get('/me', requireAuth, getMe);
authRouter.patch('/me', requireAuth, updateProfile);
