import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
});

// Note: no price is accepted from the client here. The server looks up each
// productId's current price and computes line totals / order total itself —
// this is what closes the price-tampering hole from the old /api/orders route.
export const createOrderSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(999),
      }),
    )
    .min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
});
