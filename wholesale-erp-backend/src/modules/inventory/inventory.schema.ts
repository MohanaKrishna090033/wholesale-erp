import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().cuid('Valid Category ID required'),
  warehouseId: z.string().cuid('Valid Warehouse ID required').optional(),
  unit: z.string().default('PCS'),
  costPrice: z.coerce.number().min(0.01, 'Cost price must be positive'),
  sellingPrice: z.coerce.number().min(0.01, 'Selling price must be positive'),
  currentStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').default(0),
  minStockLevel: z.coerce.number().int().min(0).default(10),
  maxStockLevel: z.coerce.number().int().min(1).default(1000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  type: z.nativeEnum(StockMovementType),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name required'),
  location: z.string().optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  warehouseId: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
