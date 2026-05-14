import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess } from '../utils/response.util';
import * as authService from '../services/auth.service';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  LogoutInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validator';

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
 * POST /api/auth/logout
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as LogoutInput;
  await authService.logout(refreshToken);
  sendSuccess(res, { message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;
  const resetToken = await authService.requestPasswordReset(email);
  sendSuccess(res, {
    message: 'If an account exists for this email, a password reset token has been generated.',
    ...(resetToken && { resetToken }),
  });
});

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body as ResetPasswordInput;
  await authService.resetPassword(token, password);
  sendSuccess(res, { message: 'Password reset successfully.' });
});

/**
 * GET /api/auth/me
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  sendSuccess(res, { user });
});
