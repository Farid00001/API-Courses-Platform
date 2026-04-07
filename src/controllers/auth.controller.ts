import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess } from '../utils/response.util';
import * as authService from '../services/auth.service';
import type { RegisterInput, LoginInput, RefreshTokenInput } from '../validators/auth.validator';

/**
 * POST /api/auth/register
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as RegisterInput;
  const result = await authService.register(data);
  sendSuccess(res, result, 201);
});

/**
 * POST /api/auth/login
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const result = await authService.login(data);
  sendSuccess(res, result);
});

/**
 * POST /api/auth/refresh
 */
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const tokens = await authService.refreshTokens(refreshToken);
  sendSuccess(res, tokens);
});

/**
 * GET /api/auth/me
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  sendSuccess(res, { user });
});
