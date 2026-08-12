import { Router } from 'express';
import * as controller from '../controllers/stores.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, requireStoreAccess, storeIdFromParam } from '../middleware/authorize.js';

// Public: browsing stores requires no authentication.
export const storesRouter = Router();
storesRouter.get('/', controller.listPublicStores);
storesRouter.get('/:id', controller.getPublicStore);

// Admin: mounted at /api/admin/stores. Every route requires auth; write
// routes additionally verify the caller manages the target store.
export const adminStoresRouter = Router();
adminStoresRouter.use(requireAuth);
adminStoresRouter.get('/', controller.listMyStores);
// Any approved admin can create their own store now (it starts pending —
// see controller.createStore); only super_admin still gets to skip review.
adminStoresRouter.post('/', requireRole('store_admin', 'super_admin'), controller.createStore);
adminStoresRouter.put('/:id', requireStoreAccess(storeIdFromParam('id')), controller.updateStore);
adminStoresRouter.get('/:id/admins', requireStoreAccess(storeIdFromParam('id')), controller.getStoreAdmins);
adminStoresRouter.post('/:id/admins', requireStoreAccess(storeIdFromParam('id')), controller.addStoreAdmin);
adminStoresRouter.delete('/:id/admins/:userId', requireStoreAccess(storeIdFromParam('id')), controller.removeStoreAdmin);
// super_admin only — a store_admin can never reach these, so they can never
// approve their own (or anyone else's) submission.
adminStoresRouter.post('/:id/approve', requireRole('super_admin'), controller.approveStore);
adminStoresRouter.post('/:id/reject', requireRole('super_admin'), controller.rejectStore);
