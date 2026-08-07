import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, products, services, storeAdmins } from '../db/schema.js';
import type { DbUser } from './users.service.js';

// Single source of truth for "can this user manage this store". Always
// queries the database — never trusts a role or storeId supplied by the
// client. super_admin bypasses the store_admins check by design (platform
// administrator); everyone else must have an explicit store_admins row.
export async function userCanManageStore(user: DbUser, storeId: number): Promise<boolean> {
  if (user.role === 'super_admin') return true;
  if (user.role !== 'store_admin') return false;

  const [link] = await db
    .select({ id: storeAdmins.id })
    .from(storeAdmins)
    .where(and(eq(storeAdmins.userId, user.id), eq(storeAdmins.storeId, storeId)))
    .limit(1);
  return Boolean(link);
}

export async function getStoreIdsManagedByUser(user: DbUser): Promise<number[] | 'all'> {
  if (user.role === 'super_admin') return 'all';
  const rows = await db.select({ storeId: storeAdmins.storeId }).from(storeAdmins).where(eq(storeAdmins.userId, user.id));
  return rows.map((r) => r.storeId);
}

export async function resolveStoreIdForProduct(productId: number): Promise<number | undefined> {
  const [row] = await db.select({ storeId: products.storeId }).from(products).where(eq(products.id, productId)).limit(1);
  return row?.storeId;
}

export async function resolveStoreIdForService(serviceId: number): Promise<number | undefined> {
  const [row] = await db.select({ storeId: services.storeId }).from(services).where(eq(services.id, serviceId)).limit(1);
  return row?.storeId;
}

export async function resolveStoreIdForOrder(orderId: number): Promise<number | undefined> {
  const [row] = await db.select({ storeId: orders.storeId }).from(orders).where(eq(orders.id, orderId)).limit(1);
  return row?.storeId;
}
