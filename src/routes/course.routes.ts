import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import { authenticate, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  publishCourseSchema,
  courseQuerySchema,
} from '../validators/course.validator';

const router = Router();

// GET /api/courses - List published courses (public)
router.get('/', validate(courseQuerySchema, 'query'), courseController.getCourses);

// GET /api/courses/mine - List all courses for authenticated teacher
router.get('/mine', authenticate, requireRole(['TEACHER']), courseController.getMyCourses);

// GET /api/courses/:slug - Get course by slug (public, increments views)
router.get('/:slug', optionalAuth, courseController.getCourseBySlug);

// POST /api/courses - Create course (TEACHER only)
router.post(
  '/',
  authenticate,
  requireRole(['TEACHER']),
  upload.single('file'),
  validate(createCourseSchema),
  courseController.createCourse
);

// PATCH /api/courses/:id - Update course metadata (TEACHER + owner)
router.patch(
  '/:id',
  authenticate,
  requireRole(['TEACHER']),
  validate(updateCourseSchema),
  courseController.updateCourse
);

// DELETE /api/courses/:id - Delete course (TEACHER + owner)
router.delete(
  '/:id',
  authenticate,
  requireRole(['TEACHER']),
  courseController.deleteCourse
);

// PATCH /api/courses/:id/publish - Change publication status (TEACHER + owner)
router.patch(
  '/:id/publish',
  authenticate,
  requireRole(['TEACHER']),
  validate(publishCourseSchema),
  courseController.publishCourse
);

// GET /api/courses/:id/download - Download source file
router.get('/:id/download', optionalAuth, courseController.downloadCourse);

export default router;
