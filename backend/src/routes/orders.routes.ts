import { Router } from 'express';
import * as controller from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStoreAccess } from '../middleware/authorize.js';
import { resolveStoreIdForOrder } from '../services/storeAccess.service.js';
import type { AuthedRequest } from '../middleware/auth.js';

// Customer-facing order endpoints. Placing an order and viewing order
// history both require the caller to be signed in — orders are always
// attached to the authenticated user's id, never a client-supplied one.
export const ordersRouter = Router();
ordersRouter.use(requireAuth);
ordersRouter.post('/', controller.placeOrder);
ordersRouter.get('/mine', controller.listMyOrders);
ordersRouter.get('/mine/:id', controller.getMyOrder);

export const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAuth);
adminOrdersRouter.get('/', controller.listAdminOrders);
adminOrdersRouter.get(
  '/:id',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForOrder(parseInt(req.params.id, 10))),
  controller.getAdminOrder,
);
adminOrdersRouter.patch(
  '/:id/status',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForOrder(parseInt(req.params.id, 10))),
  controller.updateOrderStatus,
);
