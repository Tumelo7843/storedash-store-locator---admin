import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStoreAccess, storeIdFromParam } from '../middleware/authorize.js';
import { getDashboard } from '../controllers/dashboard.controller.js';

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAuth);
adminDashboardRouter.get('/:storeId', requireStoreAccess(storeIdFromParam('storeId')), getDashboard);
