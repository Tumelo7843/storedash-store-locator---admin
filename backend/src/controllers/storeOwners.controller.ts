import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../validators/common.js';
import * as service from '../services/storeOwners.service.js';
import type { StoreOwnerSummary } from '@storedash/shared';

function toSummaryDTO(row: Awaited<ReturnType<typeof service.listStoreOwners>>[number]): StoreOwnerSummary {
  return {
    id: row.id,
    uid: row.uid,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    suspended: row.suspended,
    createdAt: row.createdAt.toISOString(),
    managedStores: row.managedStores,
  };
}

export const listStoreOwners = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const rows = await service.listStoreOwners();
  res.json({ data: rows.map(toSummaryDTO) });
});

export const suspendStoreOwner = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await service.suspendStoreOwner(req.authUser!.id, id);
  res.status(204).send();
});

export const reactivateStoreOwner = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await service.reactivateStoreOwner(req.authUser!.id, id);
  res.status(204).send();
});
