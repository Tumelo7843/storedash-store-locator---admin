import { z } from 'zod';

export const uploadQuerySchema = z.object({
  folder: z.enum(['stores', 'products', 'services']),
});
