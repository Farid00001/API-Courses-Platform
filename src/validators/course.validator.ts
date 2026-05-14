import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(2).max(100).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).default('PUBLIC'),
  allowDownload: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .default(true),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().min(2).max(100).optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).optional(),
  allowDownload: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional(),
});

export const publishCourseSchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
});

export const courseQuerySchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  authorId: z.coerce.number().int().positive().optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type PublishCourseInput = z.infer<typeof publishCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
