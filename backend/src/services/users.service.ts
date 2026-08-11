import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { AppError } from '../utils/errors.js';

export type DbUser = typeof users.$inferSelect;

// Creates the local profile on first sign-in, or refreshes email/name/phone on
// subsequent syncs. Role is deliberately never touched here — it always
// starts (and stays) 'customer' until a super_admin approves a store-owner
// application (see storeOwnerApplications.service.ts), never by editing this
// row directly from a client-supplied value.
export async function getOrCreateUser(uid: string, email: string, name?: string | null, phone?: string | null): Promise<DbUser> {
  const [user] = await db
    .insert(users)
    .values({ uid, email, name: name || null, phone: phone || null })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email, ...(name ? { name } : {}), ...(phone ? { phone } : {}) },
    })
    .returning();
  return user;
}

export async function findUserByUid(uid: string): Promise<DbUser | undefined> {
  const [user] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return user;
}

// Deliberately narrow: only name/phone are writable by the user themselves.
// role/suspended are never accepted here — see storeOwnerApplications.service
// (role) and storeOwners.service (suspended) for the only paths that touch
// those columns, both gated to super_admin server-side.
export async function updateOwnProfile(userId: number, data: { name?: string; phone?: string }): Promise<DbUser> {
  const [user] = await db
    .update(users)
    .set({ ...(data.name !== undefined ? { name: data.name } : {}), ...(data.phone !== undefined ? { phone: data.phone } : {}) })
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw AppError.notFound('User not found');
  return user;
}
