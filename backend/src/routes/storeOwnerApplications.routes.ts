import { Router } from 'express';
import * as controller from '../controllers/storeOwnerApplications.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';

// Any authenticated user (customer or existing store_admin) can apply and
// check their own application history. Mounted at /api/store-owner-applications.
export const storeOwnerApplicationsRouter = Router();
storeOwnerApplicationsRouter.use(requireAuth);
storeOwnerApplicationsRouter.post('/', controller.submitApplication);
storeOwnerApplicationsRouter.get('/mine', controller.listMyApplications);

// Super admin only. Mounted at /api/admin/store-owner-applications.
export const adminStoreOwnerApplicationsRouter = Router();
adminStoreOwnerApplicationsRouter.use(requireAuth, requireRole('super_admin'));
adminStoreOwnerApplicationsRouter.get('/', controller.listApplications);
adminStoreOwnerApplicationsRouter.get('/:id', controller.getApplication);
adminStoreOwnerApplicationsRouter.post('/:id/approve', controller.approveApplication);
adminStoreOwnerApplicationsRouter.post('/:id/reject', controller.rejectApplication);
