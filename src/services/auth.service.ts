import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { AppError } from '../errors/AppError';
import type {
  RegisterInput,
  LoginInput,
} from '../validators/auth.validator';
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

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new AppError('Invalid token payload.', 400);
  }
  return new Date(decoded.exp * 1000);
}

async function storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: getTokenExpiry(refreshToken),
    },
  });
}

async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      tokenHash: hashToken(refreshToken),
    },
  });
}

function createPasswordResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Register a new user and return tokens.
 */
export async function register(data: RegisterInput): Promise<AuthResult> {
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
  await storeRefreshToken(user.id, tokens.refreshToken);

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
  await storeRefreshToken(user.id, tokens.refreshToken);

  const { password: _, isActive: __, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

/**
 * Refresh tokens using a valid refresh token.
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashToken(refreshToken),
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or account deactivated.', 401);
    }

    await revokeRefreshToken(refreshToken);

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokens(payload);
    await storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid or expired refresh token.', 401);
  }
}

/**
 * Explicitly revoke a refresh token on logout.
 */
export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}

/**
 * Generate a password reset token for a user if the email exists.
 * In development, the raw token is returned to simplify testing.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  return env.NODE_ENV === 'development' ? rawToken : null;
}

/**
 * Reset a user's password using a valid reset token.
 */
export async function resetPassword(token: string, password: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('Invalid or expired password reset token.', 400);
  }

  const hashedPassword = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);
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
