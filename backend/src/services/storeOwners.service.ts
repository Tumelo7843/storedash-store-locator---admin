import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { storeAdmins, stores, users } from '../db/schema.js';
import { AppError } from '../utils/errors.js';

// Every store_admin/super_admin user, plus the stores each store_admin
// manages (empty for super_admin, who bypasses store_admins entirely).
export async function listStoreOwners() {
  const owners = await db.select().from(users).where(inArray(users.role, ['store_admin', 'super_admin']));
  if (owners.length === 0) return [];

  const links = await db
    .select({ userId: storeAdmins.userId, storeId: stores.id, storeName: stores.name })
    .from(storeAdmins)
    .innerJoin(stores, eq(storeAdmins.storeId, stores.id))
    .where(
      inArray(
        storeAdmins.userId,
        owners.map((o) => o.id),
      ),
    );

  const storesByUser = new Map<number, Array<{ id: number; name: string }>>();
  for (const link of links) {
    const list = storesByUser.get(link.userId) ?? [];
    list.push({ id: link.storeId, name: link.storeName });
    storesByUser.set(link.userId, list);
  }

  return owners.map((owner) => ({ ...owner, managedStores: storesByUser.get(owner.id) ?? [] }));
}

async function setSuspended(actingUserId: number, targetUserId: number, suspended: boolean) {
  if (actingUserId === targetUserId) {
    throw AppError.badRequest('You cannot suspend your own account.');
  }
  const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!user) throw AppError.notFound('User not found');

  const [updated] = await db.update(users).set({ suspended }).where(eq(users.id, targetUserId)).returning();
  return updated;
}

export const suspendStoreOwner = (actingUserId: number, targetUserId: number) => setSuspended(actingUserId, targetUserId, true);
export const reactivateStoreOwner = (actingUserId: number, targetUserId: number) => setSuspended(actingUserId, targetUserId, false);
