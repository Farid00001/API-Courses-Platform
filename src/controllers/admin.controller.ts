import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess } from '../utils/response.util';
import { AppError } from '../errors/AppError';
import * as userService from '../services/user.service';
import type { ChangeUserRoleInput } from '../validators/admin.validator';

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
