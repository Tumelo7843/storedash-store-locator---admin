import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { uploadImage } from '../controllers/uploads.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Mounted at /api/admin/uploads. Any store_admin/super_admin can upload —
// this only produces a URL, it doesn't attach it to anything; the actual
// store/product/service write routes are what enforce per-store access
// (requireStoreAccess), same as they already do for a hand-typed imageUrl.
export const uploadsRouter = Router();
uploadsRouter.post('/', requireAuth, requireRole('store_admin', 'super_admin'), upload.single('file'), uploadImage);
