import type { Request, Response } from 'express';
import path from 'path';
import { catchAsync } from '../utils/catchAsync.util';
import { sendSuccess, sendPaginated } from '../utils/response.util';
import { AppError } from '../errors/AppError';
import { FILE_TYPE_MAP } from '../config/constants';
import * as courseService from '../services/course.service';
import { getAbsolutePath } from '../services/file.service';
import type { CreateCourseInput, UpdateCourseInput, CourseQueryInput, PublishCourseInput } from '../validators/course.validator';

/**
 * GET /api/courses
 * List published courses with pagination and search.
 */
export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as CourseQueryInput;
  const { courses, pagination } = await courseService.getCourses(query);
  sendPaginated(res, courses, pagination);
});

/**
 * GET /api/courses/mine
 * List all courses for the authenticated teacher.
 */
export const getMyCourses = catchAsync(async (req: Request, res: Response) => {
  const courses = await courseService.getMyCourses(req.user!.userId);
  sendSuccess(res, { courses });
});

/**
 * GET /api/courses/:slug
 * Get course details by slug.
 */
export const getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const viewerId = req.user?.userId;
  const course = await courseService.getCourseBySlug(slug, viewerId);
  sendSuccess(res, { course });
});

/**
 * POST /api/courses
 * Create a course with file upload.
 */
export const createCourse = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('A file (.ipynb or .md) is required.', 400);
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileType = FILE_TYPE_MAP[ext];

  if (!fileType) {
    throw new AppError(`Unsupported file extension: ${ext}`, 400);
  }

  const data = req.body as CreateCourseInput;
  const course = await courseService.createCourse(data, req.file, req.user!.userId, fileType);
  sendSuccess(res, { course }, 201);
});

/**
 * PATCH /api/courses/:id
 * Update course metadata.
 */
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    throw new AppError('Invalid course ID.', 400);
  }

  const data = req.body as UpdateCourseInput;
  const course = await courseService.updateCourse(courseId, req.user!.userId, data);
  sendSuccess(res, { course });
});

/**
 * DELETE /api/courses/:id
 * Delete a course.
 */
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    throw new AppError('Invalid course ID.', 400);
  }

  await courseService.deleteCourse(courseId, req.user!.userId);
  sendSuccess(res, { message: 'Course deleted successfully.' });
});

/**
 * PATCH /api/courses/:id/publish
 * Change course publication status.
 */
export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    throw new AppError('Invalid course ID.', 400);
  }

  const { status } = req.body as PublishCourseInput;
  const course = await courseService.publishCourse(courseId, req.user!.userId, status);
  sendSuccess(res, { course });
});

/**
 * GET /api/courses/:id/download
 * Download the course source file.
 */
export const downloadCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    throw new AppError('Invalid course ID.', 400);
  }

  const requesterId = req.user?.userId;
  const course = await courseService.getCourseForDownload(courseId, requesterId);

  // Allow owner to always download; otherwise, check allowDownload
  if (req.user && req.user.userId === course.authorId) {
    // Owner can always download
  } else if (!course.allowDownload) {
    throw new AppError('Download is not allowed for this course.', 403);
  }

  const absolutePath = getAbsolutePath(course.filePath);
  res.download(absolutePath, course.originalFileName);
});
