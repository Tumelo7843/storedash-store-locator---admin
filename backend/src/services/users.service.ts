import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export type DbUser = typeof users.$inferSelect;

// Creates the local profile on first sign-in, or refreshes email/name on
// subsequent syncs. Role is deliberately never touched here — it always
// starts (and stays) 'customer' until a super_admin grants store access,
// which is done by inserting into store_admins, not by editing this row.
export async function getOrCreateUser(uid: string, email: string, name?: string | null): Promise<DbUser> {
  const [user] = await db
    .insert(users)
    .values({ uid, email, name: name || null })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email, ...(name ? { name } : {}) },
    })
    .returning();
  return user;
}

export async function findUserByUid(uid: string): Promise<DbUser | undefined> {
  const [user] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return user;
}
