import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess } from '../utils/response.util';
import { AppError } from '../errors/AppError';
import * as userService from '../services/user.service';
import type { UpdateProfileInput } from '../validators/user.validator';

/**
 * GET /api/users/:id
 * Get a user's public profile.
 */
export const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const user = await userService.getUserProfile(userId);
  sendSuccess(res, { user });
});

/**
 * GET /api/users/:id/courses
 * Get all published courses by a user.
 */
export const getUserCourses = catchAsync(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const courses = await userService.getUserCourses(userId);
  sendSuccess(res, { courses });
});

/**
 * PATCH /api/users/me
 * Update the authenticated user's profile.
 */
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.user!.userId, data);
  sendSuccess(res, { user });
});
