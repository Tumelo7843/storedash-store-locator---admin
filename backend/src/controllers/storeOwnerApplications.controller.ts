import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../validators/common.js';
import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  rejectApplicationSchema,
} from '../validators/storeOwnerApplications.validator.js';
import * as service from '../services/storeOwnerApplications.service.js';
import { toApplicationDTO, toApplicationWithApplicantDTO } from '../utils/mappers.js';

export const submitApplication = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = createApplicationSchema.parse(req.body);
  const application = await service.createApplication(req.authUser!.id, body);
  res.status(201).json({ data: toApplicationDTO(application) });
});

export const listMyApplications = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const rows = await service.listMyApplications(req.authUser!.id);
  res.json({ data: rows.map(toApplicationDTO) });
});

// Super admin: list all applications, optionally filtered by status.
export const listApplications = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = listApplicationsQuerySchema.parse(req.query);
  const rows = await service.listApplications(status);
  res.json({ data: rows.map(toApplicationWithApplicantDTO) });
});

export const getApplication = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const application = await service.getApplicationById(id);
  res.json({ data: toApplicationDTO(application) });
});

export const approveApplication = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { application, store } = await service.approveApplication(id, req.authUser!.id);
  res.json({ data: { application: toApplicationDTO(application), storeId: store.id } });
});

export const rejectApplication = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = rejectApplicationSchema.parse(req.body);
  const application = await service.rejectApplication(id, req.authUser!.id, reason);
  res.json({ data: toApplicationDTO(application) });
});
