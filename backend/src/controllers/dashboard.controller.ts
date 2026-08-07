import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardMetrics } from '../services/dashboard.service.js';
import { AppError } from '../utils/errors.js';

export const getDashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const storeId = parseInt(req.params.storeId, 10);
  if (Number.isNaN(storeId)) throw AppError.badRequest('storeId is required');
  const metrics = await getDashboardMetrics(storeId);
  res.json({ data: metrics });
});
