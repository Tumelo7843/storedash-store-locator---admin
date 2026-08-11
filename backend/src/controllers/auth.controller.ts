import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteOwnAccount, getOrCreateUser, updateOwnProfile } from '../services/users.service.js';
import { getStoreIdsManagedByUser } from '../services/storeAccess.service.js';
import { updateProfileSchema } from '../validators/auth.validator.js';
import type { UserProfile } from '@storedash/shared';

function toProfile(user: Awaited<ReturnType<typeof getOrCreateUser>>): UserProfile {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt.toISOString(),
  };
}

// Called right after Firebase sign-in to provision/refresh the local profile
// with the live email/name/phone/photo from the Firebase token (not the
// possibly stale DB copy requireAuth attached).
export const syncProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const token = req.firebaseToken!;
  const user = await getOrCreateUser(token.uid, token.email || req.authUser!.email, token.name, token.phone_number);
  res.json({ data: toProfile(user) });
});

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const managedStoreIds = await getStoreIdsManagedByUser(user);
  res.json({ data: { ...toProfile(user), managedStoreIds } });
});

// Lets a signed-in user update their own display name/phone. Deliberately
// narrow (see updateProfileSchema/updateOwnProfile) — this can never be used
// to change role or suspended, unlike a hypothetical generic PATCH /users/:id.
export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = updateProfileSchema.parse(req.body);
  const user = await updateOwnProfile(req.authUser!.id, body);
  res.json({ data: toProfile(user) });
});

// Deletes the caller's own account only — req.authUser.id comes from the
// verified token, never from a request parameter, so there is no way to
// pass another user's id here.
export const deleteAccount = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const result = await deleteOwnAccount(req.authUser!.id, req.authUser!.uid);
  res.json({ data: result });
});
