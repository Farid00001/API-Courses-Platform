import prisma from '../config/database';
import { AppError } from '../errors/AppError';
import { generateSlug } from '../utils/slugify.util';
import { convertFile } from './converter.service';
import { deleteFile, duplicateStoredFile } from './file.service';
import { PAGINATION } from '../config/constants';
import type { CreateCourseInput, UpdateCourseInput, CourseQueryInput } from '../validators/course.validator';
import type { JwtPayload, PaginationMeta } from '../types/api.types';

interface CourseListResult {
  courses: Array<Record<string, unknown>>;
  pagination: PaginationMeta;
}

type ViewerRole = JwtPayload['role'];

function buildVisibilityFilter(viewerId?: number, viewerRole?: ViewerRole) {
  if (viewerRole === 'ADMIN') {
    return null;
  }

  if (viewerId !== undefined) {
    return {
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'RESTRICTED' },
        { authorId: viewerId },
      ],
    };
  }

  return { visibility: 'PUBLIC' };
}

function canAccessCourse(
  course: { authorId: number; status: string; visibility: string },
  viewerId?: number,
  viewerRole?: ViewerRole
): boolean {
  if (viewerRole === 'ADMIN') {
    return true;
  }

  if (viewerId !== undefined && course.authorId === viewerId) {
    return true;
  }

  if (course.status !== 'PUBLISHED') {
    return false;
  }

  if (course.visibility === 'PUBLIC') {
    return true;
  }

  if (course.visibility === 'RESTRICTED' && viewerId !== undefined) {
    return true;
  }

  return false;
}

async function generateUniqueCourseSlug(baseTitle: string, excludeCourseId?: number): Promise<string> {
  const baseSlug = generateSlug(baseTitle);
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existingCourse = await prisma.course.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existingCourse || existingCourse.id === excludeCourseId) {
      break;
    }
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return candidate;
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
  const slug = await generateUniqueCourseSlug(data.title);

  const { html } = await convertFile(file.path, fileType);

  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description || null,
      slug,
      category: data.category?.trim() || null,
      fileType,
      originalFileName: file.originalname,
      filePath: file.path,
      contentHTML: html,
      visibility: data.visibility,
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
 * Get paginated list of courses with optional search and filters.
 */
export async function getCourses(
  query: CourseQueryInput,
  viewerId?: number,
  viewerRole?: ViewerRole
): Promise<CourseListResult> {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const andFilters: Array<Record<string, unknown>> = [];

  if (viewerRole === 'ADMIN' && query.status) {
    andFilters.push({ status: query.status });
  } else {
    andFilters.push({ status: 'PUBLISHED' });
  }

  const visibilityFilter = buildVisibilityFilter(viewerId, viewerRole);
  if (visibilityFilter) {
    andFilters.push(visibilityFilter);
  }

  if (query.search) {
    andFilters.push({
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.category) {
    andFilters.push({
      category: { equals: query.category.trim(), mode: 'insensitive' },
    });
  }

  if (query.authorId) {
    andFilters.push({ authorId: query.authorId });
  }

  if (query.dateFrom || query.dateTo) {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.dateFrom) {
      createdAt.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    }
    if (query.dateTo) {
      createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }
    andFilters.push({ createdAt });
  }

  const where = andFilters.length > 0 ? { AND: andFilters } : {};

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
        category: true,
        fileType: true,
        status: true,
        visibility: true,
        allowDownload: true,
        views: true,
        createdAt: true,
        publishedAt: true,
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
export async function getCourseBySlug(slug: string, viewerId?: number, viewerRole?: ViewerRole) {
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

  if (!canAccessCourse(course, viewerId, viewerRole)) {
    throw new AppError('Course not found.', 404);
  }

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
      ...(data.title !== undefined && {
        title: data.title,
        slug: await generateUniqueCourseSlug(data.title, courseId),
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category?.trim() || null }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
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

  await prisma.course.delete({ where: { id: courseId } });
  await deleteFile(course.filePath);
}

/**
 * Duplicate a course and its source file.
 */
export async function duplicateCourse(courseId: number, requesterId: number, requesterRole: ViewerRole) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  if (requesterRole !== 'ADMIN' && course.authorId !== requesterId) {
    throw new AppError('You are not authorized to duplicate this course.', 403);
  }

  const duplicatedFilePath = duplicateStoredFile(course.filePath);
  const duplicatedTitle = `${course.title} (Copy)`;
  const slug = await generateUniqueCourseSlug(duplicatedTitle);

  const duplicatedCourse = await prisma.course.create({
    data: {
      title: duplicatedTitle,
      description: course.description,
      slug,
      category: course.category,
      fileType: course.fileType,
      originalFileName: course.originalFileName,
      filePath: duplicatedFilePath,
      contentHTML: course.contentHTML,
      status: 'DRAFT',
      visibility: course.visibility,
      allowDownload: course.allowDownload,
      views: 0,
      publishedAt: null,
      authorId: requesterId,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return duplicatedCourse;
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
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
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
export async function getCourseForDownload(courseId: number, requesterId?: number, requesterRole?: ViewerRole) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      filePath: true,
      originalFileName: true,
      allowDownload: true,
      status: true,
      visibility: true,
      authorId: true,
    },
  });

  if (!course) {
    throw new AppError('Course not found.', 404);
  }

  if (!canAccessCourse(course, requesterId, requesterRole)) {
    throw new AppError('Course not found.', 404);
  }

  const isPrivilegedRequester =
    requesterRole === 'ADMIN' || (requesterId !== undefined && requesterId === course.authorId);
  if (!course.allowDownload && !isPrivilegedRequester) {
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
      category: true,
      fileType: true,
      status: true,
      visibility: true,
      allowDownload: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  return courses;
}
