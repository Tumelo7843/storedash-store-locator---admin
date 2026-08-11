import { z } from 'zod';

export const createApplicationSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100).default('General'),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120), // Province
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(120).default('South Africa'),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
