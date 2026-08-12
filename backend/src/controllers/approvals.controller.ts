import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getApprovalSummary } from '../services/approvals.service.js';

export const getSummary = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const summary = await getApprovalSummary();
  res.json({ data: summary });
});
