import prisma from '../config/database';
import { AppError } from '../errors/AppError';
import type { UpdateProfileInput } from '../validators/user.validator';

/**
 * Get a user's public profile.
 */
export async function getUserProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: { select: { courses: { where: { status: 'PUBLISHED' } } } },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}

/**
 * Get all published courses by a specific user.
 */
export async function getUserCourses(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const courses = await prisma.course.findMany({
    where: { authorId: userId, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      fileType: true,
      status: true,
      views: true,
      createdAt: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  return courses;
}

/**
 * Update the authenticated user's profile.
 */
export async function updateProfile(userId: number, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function updateUserRole(userId: number, role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
