import { z } from 'zod';
import { approvalStatusEnumSchema, optionalString, paginationQuerySchema } from './common.js';

export const listServicesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  storeId: z.coerce.number().int().positive().optional(),
  includeInactive: z.coerce.boolean().default(false),
  // Admin-only filter (e.g. the Approvals page asking for `pending`); ignored
  // on public reads, which always force approvalStatus='approved' server-side.
  approvalStatus: approvalStatusEnumSchema.optional(),
});

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  price: z.coerce.number().nonnegative(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  imageUrl: optionalString(z.string().trim().url().max(2000)),
  description: z.string().trim().max(4000).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
