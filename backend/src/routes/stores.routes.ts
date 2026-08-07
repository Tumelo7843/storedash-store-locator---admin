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
adminStoresRouter.post('/', requireRole('super_admin'), controller.createStore);
adminStoresRouter.put('/:id', requireStoreAccess(storeIdFromParam('id')), controller.updateStore);
adminStoresRouter.get('/:id/admins', requireStoreAccess(storeIdFromParam('id')), controller.getStoreAdmins);
adminStoresRouter.post('/:id/admins', requireStoreAccess(storeIdFromParam('id')), controller.addStoreAdmin);
adminStoresRouter.delete('/:id/admins/:userId', requireStoreAccess(storeIdFromParam('id')), controller.removeStoreAdmin);
