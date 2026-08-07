import { and, asc, count, eq, gte, ilike, inArray, lte, or, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { storeAdmins, stores, users } from '../db/schema.js';
import { AppError } from '../utils/errors.js';

export interface ListStoresParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  // When set, includes inactive stores (admin views only — never for public reads).
  restrictToIds?: number[] | 'all';
  includeInactive?: boolean;
}

export async function listStores(params: ListStoresParams) {
  const conditions: SQL[] = [];

  if (!params.includeInactive) {
    conditions.push(eq(stores.status, 'active'));
  }
  if (params.search) {
    const q = `%${params.search}%`;
    conditions.push(or(ilike(stores.name, q), ilike(stores.city, q), ilike(stores.address, q))!);
  }
  if (params.category) {
    conditions.push(eq(stores.category, params.category));
  }
  if (params.minLat !== undefined) conditions.push(gte(stores.lat, String(params.minLat)));
  if (params.maxLat !== undefined) conditions.push(lte(stores.lat, String(params.maxLat)));
  if (params.minLng !== undefined) conditions.push(gte(stores.lng, String(params.minLng)));
  if (params.maxLng !== undefined) conditions.push(lte(stores.lng, String(params.maxLng)));

  if (params.restrictToIds && params.restrictToIds !== 'all') {
    if (params.restrictToIds.length === 0) {
      return { rows: [], total: 0 };
    }
    conditions.push(inArray(stores.id, params.restrictToIds));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(stores)
      .where(where)
      .orderBy(asc(stores.name))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db.select({ value: count() }).from(stores).where(where),
  ]);

  return { rows, total };
}

export async function getStoreById(id: number, { includeInactive = false } = {}) {
  const [row] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!row) throw AppError.notFound('Store not found');
  if (row.status !== 'active' && !includeInactive) throw AppError.notFound('Store not found');
  return row;
}

export async function createStore(data: typeof stores.$inferInsert) {
  const [row] = await db.insert(stores).values(data).returning();
  return row;
}

export async function updateStore(id: number, data: Partial<typeof stores.$inferInsert>) {
  const [row] = await db
    .update(stores)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(stores.id, id))
    .returning();
  if (!row) throw AppError.notFound('Store not found');
  return row;
}

export async function listStoreAdmins(storeId: number) {
  return db
    .select({ id: storeAdmins.id, userId: users.id, email: users.email, name: users.name, addedAt: storeAdmins.createdAt })
    .from(storeAdmins)
    .innerJoin(users, eq(storeAdmins.userId, users.id))
    .where(eq(storeAdmins.storeId, storeId));
}

export async function addStoreAdminByEmail(storeId: number, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw AppError.badRequest('No user found with that email. They must sign in to the app at least once before being granted admin access.');
  }

  await db.transaction(async (tx) => {
    if (user.role === 'customer') {
      await tx.update(users).set({ role: 'store_admin' }).where(eq(users.id, user.id));
    }
    await tx.insert(storeAdmins).values({ userId: user.id, storeId }).onConflictDoNothing();
  });

  return user;
}

export async function removeStoreAdmin(storeId: number, userId: number) {
  await db.delete(storeAdmins).where(and(eq(storeAdmins.storeId, storeId), eq(storeAdmins.userId, userId)));
}
