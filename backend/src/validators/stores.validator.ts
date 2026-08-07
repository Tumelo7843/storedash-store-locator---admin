import { z } from 'zod';
import { openingHoursSchema, paginationQuerySchema } from './common.js';

export const listStoresQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  // Bounding box for "nearby" filtering, computed client-side from user lat/lng.
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
});

const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
});

export const createStoreSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    category: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(300),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().min(1).max(120),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().min(1).max(120).default('United States'),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(200).optional(),
    imageUrl: z.string().trim().url().max(2000).optional(),
    bannerUrl: z.string().trim().url().max(2000).optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    deliveryAvailable: z.boolean().default(false),
    pickupAvailable: z.boolean().default(true),
    openingHours: openingHoursSchema.optional(),
  })
  .merge(latLngSchema);

export const updateStoreSchema = createStoreSchema.partial();
