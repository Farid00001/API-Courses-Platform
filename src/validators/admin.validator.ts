import { z } from 'zod';

export const changeUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
