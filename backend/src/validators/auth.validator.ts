import { z } from 'zod';
import { optionalString } from './common.js';

// name/phone/showApprovalBadges only — role and suspended are never
// client-writable (see users.service.ts updateOwnProfile). At least one
// field must actually be present, or there's nothing for the database
// UPDATE to set.
export const updateProfileSchema = z
  .object({
    name: optionalString(z.string().trim().min(1).max(200)),
    phone: optionalString(z.string().trim().min(1).max(40)),
    showApprovalBadges: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined || data.showApprovalBadges !== undefined, {
    message: 'Provide at least a name, phone, or notification preference to update.',
  });
