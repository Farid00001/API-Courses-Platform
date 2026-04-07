import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// PATCH /api/users/me - Update authenticated user's profile
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

// GET /api/users/:id - Public profile
router.get('/:id', userController.getUserProfile);

// GET /api/users/:id/courses - Public courses by user
router.get('/:id/courses', userController.getUserCourses);

export default router;
