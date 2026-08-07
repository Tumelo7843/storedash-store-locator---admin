import type { NextFunction, Response } from 'express';
import type { UserRole } from '@storedash/shared';
import { userCanManageStore } from '../services/storeAccess.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthedRequest } from './auth.js';

// Must run after requireAuth.
export function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.authUser) throw AppError.unauthorized();
    if (!roles.includes(req.authUser.role)) {
      throw AppError.forbidden(`This action requires one of these roles: ${roles.join(', ')}`);
    }
    next();
  };
}

// Verifies the authenticated user manages the store identified by storeId.
// storeId is resolved server-side via `resolveStoreId` (e.g. from a product
// row's storeId column) — it is never taken from the request body, because
// the body is attacker-controlled.
export function requireStoreAccess(resolveStoreId: (req: AuthedRequest) => Promise<number | undefined>) {
  return asyncHandler(async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.authUser) throw AppError.unauthorized();

    const storeId = await resolveStoreId(req);
    if (storeId === undefined) throw AppError.notFound('Resource not found');

    const allowed = await userCanManageStore(req.authUser, storeId);
    if (!allowed) throw AppError.forbidden('You do not manage this store');

    (req as AuthedRequest & { resolvedStoreId: number }).resolvedStoreId = storeId;
    next();
  });
}

export function storeIdFromParam(paramName = 'storeId') {
  return async (req: AuthedRequest) => {
    const raw = req.params[paramName];
    const id = parseInt(raw, 10);
    return Number.isNaN(id) ? undefined : id;
  };
}
