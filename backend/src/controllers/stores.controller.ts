import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toStoreDTO } from '../utils/mappers.js';
import { listStoresQuerySchema, createStoreSchema, updateStoreSchema } from '../validators/stores.validator.js';
import { idParamSchema, rejectReasonSchema } from '../validators/common.js';
import * as storesService from '../services/stores.service.js';
import { getStoreIdsManagedByUser } from '../services/storeAccess.service.js';
import { AppError } from '../utils/errors.js';

export const listPublicStores = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = listStoresQuerySchema.parse(req.query);
  // Public reads always force approvalStatus='approved', ignoring any
  // approvalStatus the query string might ask for (that param only means
  // anything on the admin-authenticated listMyStores below).
  const { rows, total } = await storesService.listStores({ ...query, requireApproved: true });
  res.json({
    data: rows.map(toStoreDTO),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 },
  });
});

export const getPublicStore = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const store = await storesService.getStoreById(id);
  res.json({ data: toStoreDTO(store) });
});

// Admin: stores the authenticated user manages (all stores for super_admin).
// `query.approvalStatus`, when present, is what powers the Approvals page
// (a super_admin listing only 'pending' stores) — an ordinary store_admin
// gets it too, so they can filter their own dashboard the same way.
export const listMyStores = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const query = listStoresQuerySchema.parse(req.query);
  const storeIds = await getStoreIdsManagedByUser(user);
  const { rows, total } = await storesService.listStores({ ...query, restrictToIds: storeIds, includeInactive: true });
  res.json({
    data: rows.map(toStoreDTO),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 },
  });
});

// Any store_admin or super_admin can create a store (requireRole in
// stores.routes.ts) — but a store_admin's store starts approvalStatus
// 'pending' and stays invisible to customers until a super_admin approves it
// (see storesService.approveStore). A super_admin's own creation is
// auto-approved (self-review would be meaningless — they already have
// unrestricted access) so platform-created stores don't need a round trip
// through their own approval queue.
export const createStore = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = createStoreSchema.parse(req.body);
  const isSuperAdmin = req.authUser!.role === 'super_admin';

  const store = await storesService.createStore({
    ...body,
    lat: body.lat !== undefined && body.lat !== null ? String(body.lat) : undefined,
    lng: body.lng !== undefined && body.lng !== null ? String(body.lng) : undefined,
    ...(isSuperAdmin
      ? { approvalStatus: 'approved', reviewedBy: req.authUser!.id, reviewedAt: new Date() }
      : { approvalStatus: 'pending' }),
  });

  // The creator becomes the first admin unless this is a super_admin acting on
  // behalf of someone else (adminEmail in the body — handled by a follow-up
  // POST /api/admin/stores/:id/admins call from the frontend).
  await storesService.addStoreAdminByEmail(store.id, req.authUser!.email).catch(() => undefined);

  res.status(201).json({ data: toStoreDTO(store) });
});

export const updateStore = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateStoreSchema.parse(req.body);
  const store = await storesService.updateStore(
    id,
    {
      ...body,
      lat: body.lat !== undefined ? (body.lat === null ? null : String(body.lat)) : undefined,
      lng: body.lng !== undefined ? (body.lng === null ? null : String(body.lng)) : undefined,
    },
    // A store_admin editing their own rejected store resubmits it for review
    // by the act of saving; a super_admin's edits never change approval state.
    { resubmitIfRejected: req.authUser!.role !== 'super_admin' },
  );
  res.json({ data: toStoreDTO(store) });
});

// Both super_admin only (see stores.routes.ts) — a store_admin can never
// approve their own (or anyone else's) submission, by construction: they
// can't reach this handler in the first place.
export const approveStore = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const store = await storesService.approveStore(id, req.authUser!.id);
  res.json({ data: toStoreDTO(store) });
});

export const rejectStore = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = rejectReasonSchema.parse(req.body);
  const store = await storesService.rejectStore(id, req.authUser!.id, reason);
  res.json({ data: toStoreDTO(store) });
});

export const getStoreAdmins = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const admins = await storesService.listStoreAdmins(id);
  res.json({ data: admins });
});

export const addStoreAdmin = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) throw AppError.badRequest('email is required');
  const user = await storesService.addStoreAdminByEmail(id, email);
  res.status(201).json({ data: { id: user.id, email: user.email, name: user.name } });
});

export const removeStoreAdmin = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const userId = parseInt(req.params.userId, 10);
  await storesService.removeStoreAdmin(id, userId);
  res.status(204).send();
});
