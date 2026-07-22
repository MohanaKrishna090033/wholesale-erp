import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().cuid('Valid Product ID required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  discount: z.coerce.number().min(0).max(100).default(0),
});

export const createChallanSchema = z.object({
  customerId: z.string().cuid('Valid Customer ID required'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(18),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(challanItemSchema).min(1, 'At least one item is required in the challan'),
});

export const updateChallanSchema = createChallanSchema.partial();

export const listChallansQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type ChallanItemInput = z.infer<typeof challanItemSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ListChallansQuery = z.infer<typeof listChallansQuerySchema>;
