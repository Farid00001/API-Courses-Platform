import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess } from '../utils/response.util';
import { AppError } from '../errors/AppError';
import * as userService from '../services/user.service';
import type { ChangeUserRoleInput, ChangeUserStatusInput } from '../validators/admin.validator';

/**
 * PATCH /api/admin/users/:id/role
 */
export const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const data = req.body as ChangeUserRoleInput;
  const user = await userService.updateUserRole(userId, data.role);
  sendSuccess(res, { user });
});

/**
 * PATCH /api/admin/users/:id/status
 */
export const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const data = req.body as ChangeUserStatusInput;
  const user = await userService.updateUserStatus(userId, data.isActive);
  sendSuccess(res, { user });
});

/**
 * DELETE /api/admin/users/:id
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  if (req.user?.userId === userId) {
    throw new AppError('You cannot delete your own admin account.', 400);
  }

  const user = await userService.deleteUserAccount(userId);
  sendSuccess(res, { user, message: 'User deleted successfully.' });
});
