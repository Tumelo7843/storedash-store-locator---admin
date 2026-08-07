import { Router } from 'express';
import * as controller from '../controllers/storeServices.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStoreAccess } from '../middleware/authorize.js';
import { resolveStoreIdForService } from '../services/storeAccess.service.js';
import type { AuthedRequest } from '../middleware/auth.js';

export const servicesRouter = Router();
servicesRouter.get('/', controller.listPublicServices);
servicesRouter.get('/:id', controller.getPublicService);

export const adminServicesRouter = Router();
adminServicesRouter.use(requireAuth);
adminServicesRouter.get('/', controller.listMyServices);
adminServicesRouter.post('/', controller.createService);
adminServicesRouter.put(
  '/:id',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForService(parseInt(req.params.id, 10))),
  controller.updateService,
);
adminServicesRouter.delete(
  '/:id',
  requireStoreAccess(async (req: AuthedRequest) => resolveStoreIdForService(parseInt(req.params.id, 10))),
  controller.deleteService,
);
