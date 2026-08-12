import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toServiceDTO } from '../utils/mappers.js';
import { listServicesQuerySchema, createServiceSchema, updateServiceSchema } from '../validators/services.validator.js';
import { idParamSchema, rejectReasonSchema } from '../validators/common.js';
import * as servicesService from '../services/storeServices.service.js';
import { getStoreIdsManagedByUser, userCanManageStore } from '../services/storeAccess.service.js';
import { AppError } from '../utils/errors.js';

export const listPublicServices = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = listServicesQuerySchema.parse(req.query);
  const { rows, total } = await servicesService.listServices({ ...query, includeInactive: false, requireApproved: true });
  res.json({
    data: rows.map(toServiceDTO),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 },
  });
});

export const getPublicService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const service = await servicesService.getServiceById(id);
  if (!service.isActive || service.approvalStatus !== 'approved') throw AppError.notFound('Service not found');
  res.json({ data: toServiceDTO(service) });
});

export const listMyServices = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const query = listServicesQuerySchema.parse(req.query);

  if (query.storeId) {
    const allowed = await userCanManageStore(user, query.storeId);
    if (!allowed) throw AppError.forbidden('You do not manage this store');
    const { rows, total } = await servicesService.listServices({ ...query, includeInactive: true });
    res.json({ data: rows.map(toServiceDTO), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
    return;
  }

  const storeIds = await getStoreIdsManagedByUser(user);
  const { rows, total } = await servicesService.listServices({ ...query, includeInactive: true, restrictToStoreIds: storeIds });
  res.json({ data: rows.map(toServiceDTO), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
});

export const createService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const storeId = parseInt(req.body.storeId, 10);
  if (Number.isNaN(storeId)) throw AppError.badRequest('storeId is required');
  const allowed = await userCanManageStore(req.authUser!, storeId);
  if (!allowed) throw AppError.forbidden('You do not manage this store');

  const body = createServiceSchema.parse(req.body);
  const isSuperAdmin = req.authUser!.role === 'super_admin';
  const service = await servicesService.createService({
    ...body,
    storeId,
    price: String(body.price),
    ...(isSuperAdmin
      ? { approvalStatus: 'approved', reviewedBy: req.authUser!.id, reviewedAt: new Date() }
      : { approvalStatus: 'pending' }),
  });
  res.status(201).json({ data: toServiceDTO(service) });
});

export const updateService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateServiceSchema.parse(req.body);
  const service = await servicesService.updateService(
    id,
    {
      ...body,
      price: body.price !== undefined ? String(body.price) : undefined,
    },
    { resubmitIfRejected: req.authUser!.role !== 'super_admin' },
  );
  res.json({ data: toServiceDTO(service) });
});

export const deleteService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await servicesService.deleteService(id);
  res.status(204).send();
});

// super_admin only (see services.routes.ts).
export const approveService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const service = await servicesService.approveService(id, req.authUser!.id);
  res.json({ data: toServiceDTO(service) });
});

export const rejectService = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = rejectReasonSchema.parse(req.body);
  const service = await servicesService.rejectService(id, req.authUser!.id, reason);
  res.json({ data: toServiceDTO(service) });
});
