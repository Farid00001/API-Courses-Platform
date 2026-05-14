import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { changeUserRoleSchema, changeUserStatusSchema } from '../validators/admin.validator';

const router = Router();

// PATCH /api/admin/users/:id/role
router.patch(
  '/users/:id/role',
  authenticate,
  requireRole(['ADMIN']),
  validate(changeUserRoleSchema),
  adminController.changeUserRole
);

// PATCH /api/admin/users/:id/status
router.patch(
  '/users/:id/status',
  authenticate,
  requireRole(['ADMIN']),
  validate(changeUserStatusSchema),
  adminController.changeUserStatus
);

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), adminController.deleteUser);

export default router;
