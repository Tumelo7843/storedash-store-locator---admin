import { Router } from 'express';
import * as controller from '../controllers/storeOwners.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';

// Super admin only. Mounted at /api/admin/store-owners.
export const storeOwnersRouter = Router();
storeOwnersRouter.use(requireAuth, requireRole('super_admin'));
storeOwnersRouter.get('/', controller.listStoreOwners);
storeOwnersRouter.post('/:id/suspend', controller.suspendStoreOwner);
storeOwnersRouter.post('/:id/reactivate', controller.reactivateStoreOwner);
