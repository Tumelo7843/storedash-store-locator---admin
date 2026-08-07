import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getOrCreateUser } from '../services/users.service.js';
import { getStoreIdsManagedByUser } from '../services/storeAccess.service.js';
import type { UserProfile } from '@storedash/shared';

function toProfile(user: Awaited<ReturnType<typeof getOrCreateUser>>): UserProfile {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

// Called right after Firebase sign-in to provision/refresh the local profile
// with the live email/name/photo from the Firebase token (not the possibly
// stale DB copy requireAuth attached).
export const syncProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const token = req.firebaseToken!;
  const user = await getOrCreateUser(token.uid, token.email || req.authUser!.email, token.name);
  res.json({ data: toProfile(user) });
});

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const managedStoreIds = await getStoreIdsManagedByUser(user);
  res.json({ data: { ...toProfile(user), managedStoreIds } });
});
