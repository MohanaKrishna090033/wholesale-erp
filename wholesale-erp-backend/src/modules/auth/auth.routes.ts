import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { authLimiter } from '../../shared/middleware/rateLimit.middleware';
import { loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema';

export const authRouter = Router();
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
authRouter.patch('/me', authenticate, validate({ body: updateProfileSchema }), authController.updateMe);
authRouter.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
