import { and, asc, count, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { services } from '../db/schema.js';
import { AppError } from '../utils/errors.js';

export interface ListServicesParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  storeId?: number;
  restrictToStoreIds?: number[] | 'all';
  includeInactive?: boolean;
}

export async function listServices(params: ListServicesParams) {
  const conditions: SQL[] = [];

  if (!params.includeInactive) conditions.push(eq(services.isActive, true));
  if (params.storeId) conditions.push(eq(services.storeId, params.storeId));
  if (params.search) {
    const q = `%${params.search}%`;
    conditions.push(or(ilike(services.name, q), ilike(services.category, q))!);
  }
  if (params.category) conditions.push(eq(services.category, params.category));

  if (params.restrictToStoreIds && params.restrictToStoreIds !== 'all') {
    if (params.restrictToStoreIds.length === 0) return { rows: [], total: 0 };
    conditions.push(inArray(services.storeId, params.restrictToStoreIds));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(services)
      .where(where)
      .orderBy(asc(services.name))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db.select({ value: count() }).from(services).where(where),
  ]);

  return { rows, total };
}

export async function getServiceById(id: number) {
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!row) throw AppError.notFound('Service not found');
  return row;
}

export async function createService(data: typeof services.$inferInsert) {
  const [row] = await db.insert(services).values(data).returning();
  return row;
}

export async function updateService(id: number, data: Partial<typeof services.$inferInsert>) {
  const [row] = await db
    .update(services)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  if (!row) throw AppError.notFound('Service not found');
  return row;
}

export async function deleteService(id: number) {
  const [row] = await db.delete(services).where(eq(services.id, id)).returning({ id: services.id });
  if (!row) throw AppError.notFound('Service not found');
}
