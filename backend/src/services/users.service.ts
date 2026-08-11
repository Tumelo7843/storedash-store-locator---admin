import { count, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, storeAdmins, users } from '../db/schema.js';
import { adminAuth } from '../lib/firebase-admin.js';
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

// Deletes the caller's own account — never takes a target id, only ever acts
// on the uid/id resolved server-side from the caller's own verified token
// (see auth.controller.ts), so this can never be used to delete anyone else.
//
// Order matters here, and it's the opposite of "delete the DB row, then tell
// Firebase": requireAuth lazily re-provisions a `users` row for any uid with
// a still-valid ID token (that's the whole point of lazy provisioning — see
// its comment in middleware/auth.ts), which means deleting only the DB row
// leaves a window where the *same* not-yet-expired token can "resurrect" the
// account on its very next request, simply by being valid. Deleting the
// Firebase Auth account FIRST closes that off at the source — once
// `adminAuth.deleteUser` succeeds, that identity can never re-provision a row
// again, regardless of what a client does or doesn't do with its now-stale
// token afterward. (A theoretical residual case remains: Firebase ID tokens
// are self-contained JWTs that `verifyIdToken` checks cryptographically
// without a network round-trip by default, so an *already-issued, not-yet-
// expired* token could in principle still pass verification for the rest of
// its ~1 hour lifetime even after the account is deleted. Checking
// `checkRevoked` on every request would close this, at the cost of a Firebase
// round-trip on every authenticated request — a tradeoff this app already
// deliberately avoids elsewhere, per the lazy-provisioning comment above —
// and since this can only ever "undo" a user's deletion of their *own*
// account, not grant access to anyone else's, it isn't a privilege-escalation
// risk, just a narrow, low-severity self-service edge case.)
//
// orders.userId is ON DELETE RESTRICT by design (schema.ts) — order history
// must survive even if the customer who placed it later deletes their
// account, and orders already snapshot customerName/customerEmail at order
// time for exactly this reason. So: a user with no orders is hard-deleted;
// a user with order history is anonymized in place instead (email/name/
// phone cleared, suspended so a coincidentally-reused uid could never
// authenticate as them again) rather than left fully identifiable forever.
// Either way, store_admins rows are removed first so a deleted/anonymized
// account never retains store-management access.
export async function deleteOwnAccount(userId: number, uid: string): Promise<{ hardDeleted: boolean }> {
  await adminAuth.deleteUser(uid).catch((err) => {
    // already deleted (e.g. a retried request) is fine to continue past;
    // anything else is a real failure and should stop before touching the DB.
    if (err?.code !== 'auth/user-not-found') throw err;
  });

  return db.transaction(async (tx) => {
    const [{ value: orderCount }] = await tx.select({ value: count() }).from(orders).where(eq(orders.userId, userId));

    await tx.delete(storeAdmins).where(eq(storeAdmins.userId, userId));

    if (orderCount > 0) {
      await tx
        .update(users)
        .set({ email: `deleted-user-${userId}@storedash.invalid`, name: null, phone: null, avatarUrl: null, role: 'customer', suspended: true })
        .where(eq(users.id, userId));
      return { hardDeleted: false };
    }

    await tx.delete(users).where(eq(users.id, userId));
    return { hardDeleted: true };
  });
}
