import { z } from 'zod';

// Optional form fields (email, imageUrl, ...) round-trip through the admin
// UI as "" when cleared, not undefined — without this, z.string().email()/
// .url() reject the empty string and a save with a blank optional field 400s.
export function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === '' ? undefined : val), schema.optional());
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const dayHoursSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'),
  closed: z.boolean(),
});

export const openingHoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const approvalStatusEnumSchema = z.enum(['pending', 'approved', 'rejected']);

// Shared by every approve/reject action (stores, products, services) so the
// "why was this rejected" message the owner sees is held to one consistent
// shape across the app.
export const rejectReasonSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});
