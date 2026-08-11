import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { env } from '../env.js';
import { uploadQuerySchema } from '../validators/uploads.validator.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// multer (memoryStorage, 5MB limit) already ran as route middleware — see
// uploads.routes.ts. This just pushes the buffer to Supabase Storage and
// hands back a public URL for the caller to store as imageUrl/bannerUrl,
// exactly like the plain-text URL field it replaces.
export const uploadImage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!supabaseAdmin) throw new AppError(500, 'INTERNAL_ERROR', 'Image uploads are not configured on this server');

  const { folder } = uploadQuerySchema.parse(req.query);
  const file = req.file;
  if (!file) throw AppError.badRequest('No file uploaded (expected multipart field "file")');
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw AppError.badRequest('File must be a JPEG, PNG, WebP, or GIF image');
  }

  const path = `${folder}/${req.authUser!.id}/${Date.now()}-${randomUUID()}.${EXT_BY_MIME[file.mimetype]}`;

  const { error } = await supabaseAdmin.storage.from(env.supabaseStorageBucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw new AppError(500, 'INTERNAL_ERROR', `Upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(env.supabaseStorageBucket).getPublicUrl(path);
  res.status(201).json({ data: { url: data.publicUrl } });
});
