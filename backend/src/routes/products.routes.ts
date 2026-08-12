import { Router } from 'express';
import * as controller from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, requireStoreAccess } from '../middleware/authorize.js';
import { resolveStoreIdForProduct } from '../services/storeAccess.service.js';
import type { AuthedRequest } from '../middleware/auth.js';

export const productsRouter = Router();
productsRouter.get('/', controller.listPublicProducts);
productsRouter.get('/:id', controller.getPublicProduct);

export const adminProductsRouter = Router();
adminProductsRouter.use(requireAuth);
adminProductsRouter.get('/', controller.listMyProducts);
// Access for create is checked inside the controller (storeId comes from the
// request body, which is the resource being targeted, not an untrusted claim).
adminProductsRouter.post('/', controller.createProduct);
adminProductsRouter.put(
  '/:id',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForProduct(parseInt(req.params.id, 10))),
  controller.updateProduct,
);
adminProductsRouter.delete(
  '/:id',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForProduct(parseInt(req.params.id, 10))),
  controller.deleteProduct,
);
// super_admin only — a store_admin can never approve their own submission.
adminProductsRouter.post('/:id/approve', requireRole('super_admin'), controller.approveProduct);
adminProductsRouter.post('/:id/reject', requireRole('super_admin'), controller.rejectProduct);
