import { z } from 'zod';
import { ActivityAction } from '@prisma/client';

export const listActivityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  action: z.nativeEnum(ActivityAction).optional(),
});

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
