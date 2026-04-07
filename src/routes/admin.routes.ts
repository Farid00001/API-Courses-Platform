import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { changeUserRoleSchema } from '../validators/admin.validator';

const router = Router();

// PATCH /api/admin/users/:id/role
router.patch(
  '/users/:id/role',
  authenticate,
  requireRole(['ADMIN']),
  validate(changeUserRoleSchema),
  adminController.changeUserRole
);

export default router;
