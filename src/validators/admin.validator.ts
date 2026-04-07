import { z } from 'zod';

export const changeUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
