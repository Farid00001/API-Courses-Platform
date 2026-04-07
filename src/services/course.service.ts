import prisma from '../config/database';
import { AppError } from '../errors/AppError';
import { generateSlug } from '../utils/slugify.util';
import { convertFile } from './converter.service';
import { deleteFile } from './file.service';
import { PAGINATION } from '../config/constants';
import type { CreateCourseInput, UpdateCourseInput, CourseQueryInput } from '../validators/course.validator';
import type { PaginationMeta } from '../types/api.types';

interface CourseListResult {
  courses: Array<Record<string, unknown>>;
  pagination: PaginationMeta;
}

/**
 * Create a new course with file upload and conversion.
 */
export async function createCourse(
  data: CreateCourseInput,
  file: Express.Multer.File,
  authorId: number,
  fileType: 'NOTEBOOK' | 'MARKDOWN'
) {
  const slug = generateSlug(data.title);

  // Convert the file to HTML
  const { html } = await convertFile(file.path, fileType);

  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description || null,
      slug,
      fileType,
      originalFileName: file.originalname,
      filePath: file.path,
      contentHTML: html,
      allowDownload: data.allowDownload ?? true,
      authorId,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return course;
}

/**
 * Get paginated list of courses with optional search and status filter.
 */
export async function getCourses(query: CourseQueryInput): Promise<CourseListResult> {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  // Default to PUBLISHED for public access
  where.status = query.status || 'PUBLISHED';

  // ILIKE search on title and description
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        fileType: true,
        status: true,
        allowDownload: true,
        views: true,
        createdAt: true,
        // publishedAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const pagination: PaginationMeta = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return { courses, pagination };
}

/**
 * Get a course by slug and increment view count.
 */
export async function getCourseBySlug(slug: string, viewerId?: number) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  // Public users can only access published courses.
  // Owners can access their own drafts/archived courses.
  if (course.status !== 'PUBLISHED' && course.authorId !== viewerId) {
    throw new AppError('Course not found.', 404);
  }

  // Increment view count
  await prisma.course.update({
    where: { id: course.id },
    data: { views: { increment: 1 } },
  });

  return { ...course, views: course.views + 1 };
}

/**
 * Update a course's metadata.
 */
export async function updateCourse(courseId: number, authorId: number, data: UpdateCourseInput) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  if (course.authorId !== authorId) {
    throw new AppError('You are not authorized to modify this course.', 403);
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.allowDownload !== undefined && { allowDownload: data.allowDownload }),
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return updatedCourse;
}

/**
 * Delete a course and its associated file.
 */
export async function deleteCourse(courseId: number, authorId: number) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  if (course.authorId !== authorId) {
    throw new AppError('You are not authorized to delete this course.', 403);
  }

  // Delete from DB first
  await prisma.course.delete({ where: { id: courseId } });

  // Then delete the file
  await deleteFile(course.filePath);
}

/**
 * Change the publication status of a course.
 */
export async function publishCourse(
  courseId: number,
  authorId: number,
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  if (course.authorId !== authorId) {
    throw new AppError('You are not authorized to modify this course.', 403);
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : course.publishedAt,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return updatedCourse;
}

/**
 * Get the file path for downloading a course's source file.
 */
export async function getCourseForDownload(courseId: number, requesterId?: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      filePath: true,
      originalFileName: true,
      allowDownload: true,
      status: true,
      authorId: true,
    },
  });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  const isOwner = requesterId !== undefined && requesterId === course.authorId;
  if (!course.allowDownload && !isOwner) {
    throw new AppError('Download is not allowed for this course.', 403);
  }

  return course;
}

/**
 * Get courses authored by a specific teacher, including all statuses.
 */
export async function getMyCourses(authorId: number) {
  const courses = await prisma.course.findMany({
    where: { authorId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      fileType: true,
      status: true,
      allowDownload: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  return courses;
}
