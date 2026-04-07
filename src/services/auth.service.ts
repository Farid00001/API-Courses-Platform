import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { AppError } from '../errors/AppError';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';
import type { AuthTokens, JwtPayload } from '../types/api.types';

interface AuthResult {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user and return tokens.
 */
export async function register(data: RegisterInput): Promise<AuthResult> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'STUDENT',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  return { user, ...tokens };
}

/**
 * Authenticate a user with email and password.
 */
export async function login(data: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      password: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  const { password: _, isActive: __, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

/**
 * Refresh tokens using a valid refresh token.
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or account deactivated.', 401);
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    return generateTokens(payload);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired refresh token.', 401);
  }
}

/**
 * Get the current authenticated user's profile.
 */
export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: { select: { courses: true } },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}
