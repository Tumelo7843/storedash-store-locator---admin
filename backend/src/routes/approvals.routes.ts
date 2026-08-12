import { Router } from 'express';
import * as controller from '../controllers/approvals.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';

// Super admin only. Mounted at /api/admin/approvals. The actual pending
// stores/products/services lists live on their own existing admin routers
// (GET /api/admin/{stores,products,services}?approvalStatus=pending) — this
// router only serves the summary counts for the nav badge.
export const approvalsRouter = Router();
approvalsRouter.use(requireAuth, requireRole('super_admin'));
approvalsRouter.get('/summary', controller.getSummary);
