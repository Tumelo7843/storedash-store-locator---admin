import { z } from 'zod';
import { optionalString, paginationQuerySchema } from './common.js';

export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  storeId: z.coerce.number().int().positive().optional(),
  // Admin-only filter to include inactive products; ignored on public reads.
  includeInactive: z.coerce.boolean().default(false),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(60),
  category: z.string().trim().min(1).max(100),
  brand: z.string().trim().max(100).optional(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  imageUrl: optionalString(z.string().trim().url().max(2000)),
  description: z.string().trim().max(4000).optional(),
  unit: z.string().trim().max(40).optional(),
});

export const updateProductSchema = createProductSchema.partial();
