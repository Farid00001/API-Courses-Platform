import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', validate(logoutSchema), authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

export default router;
