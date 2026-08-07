import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.js';
import { findUserByUid, getOrCreateUser } from '../services/users.service.js';
import type { DbUser } from '../services/users.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export interface AuthedRequest extends Request {
  authUser?: DbUser;
  // The freshly-decoded Firebase token, for the rare cases (profile sync)
  // that need the live email/name rather than the possibly-stale DB copy.
  firebaseToken?: DecodedIdToken;
}

async function verifyAndLoadUser(req: AuthedRequest): Promise<DbUser | undefined> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;

  const token = authHeader.slice('Bearer '.length);
  const decoded = await adminAuth.verifyIdToken(token);
  req.firebaseToken = decoded;
  // Lazily provision on first sign-in; on every later request just look the
  // user up (no write) so authenticated requests don't each cost a DB write.
  // Profile fields (email/name) are refreshed explicitly via /api/auth/sync.
  const existing = await findUserByUid(decoded.uid);
  if (existing) return existing;
  return getOrCreateUser(decoded.uid, decoded.email || '', decoded.name);
}

// Attaches req.authUser from a verified Firebase ID token, or rejects the request.
export const requireAuth = asyncHandler(async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  let user: DbUser | undefined;
  try {
    user = await verifyAndLoadUser(req);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired authentication token');
  }
  if (!user) throw AppError.unauthorized('Missing authentication token');
  req.authUser = user;
  next();
});

// Attaches req.authUser if a valid token is present; never rejects the request.
// Used on public endpoints that personalize the response when signed in.
export const optionalAuth = asyncHandler(async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  try {
    req.authUser = await verifyAndLoadUser(req);
  } catch {
    req.authUser = undefined;
  }
  next();
});
