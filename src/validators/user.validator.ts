import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
