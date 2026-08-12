import { and, asc, count, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { AppError } from '../utils/errors.js';

export interface ListProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  storeId?: number;
  restrictToStoreIds?: number[] | 'all';
  includeInactive?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  // Public reads: force approvalStatus='approved' regardless of the above.
  requireApproved?: boolean;
}

export async function listProducts(params: ListProductsParams) {
  const conditions: SQL[] = [];

  if (!params.includeInactive) conditions.push(eq(products.isActive, true));
  if (params.requireApproved) {
    conditions.push(eq(products.approvalStatus, 'approved'));
  } else if (params.approvalStatus) {
    conditions.push(eq(products.approvalStatus, params.approvalStatus));
  }
  if (params.storeId) conditions.push(eq(products.storeId, params.storeId));
  if (params.search) {
    const q = `%${params.search}%`;
    conditions.push(or(ilike(products.name, q), ilike(products.sku, q), ilike(products.category, q))!);
  }
  if (params.category) conditions.push(eq(products.category, params.category));

  if (params.restrictToStoreIds && params.restrictToStoreIds !== 'all') {
    if (params.restrictToStoreIds.length === 0) return { rows: [], total: 0 };
    conditions.push(inArray(products.storeId, params.restrictToStoreIds));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(asc(products.name))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db.select({ value: count() }).from(products).where(where),
  ]);

  return { rows, total };
}

export async function getProductById(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) throw AppError.notFound('Product not found');
  return row;
}

export async function createProduct(data: typeof products.$inferInsert) {
  const [row] = await db.insert(products).values(data).returning().catch((err) => {
    if (String(err.message).includes('products_store_sku_unique')) {
      throw AppError.conflict('A product with this SKU already exists for this store');
    }
    throw err;
  });
  return row;
}

// resubmitIfRejected: see stores.service.ts's updateStore — same pattern.
export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>, opts: { resubmitIfRejected?: boolean } = {}) {
  let resubmit: Partial<typeof products.$inferInsert> = {};
  if (opts.resubmitIfRejected) {
    const [current] = await db.select({ approvalStatus: products.approvalStatus }).from(products).where(eq(products.id, id)).limit(1);
    if (current?.approvalStatus === 'rejected') {
      resubmit = { approvalStatus: 'pending', reviewedBy: null, reviewedAt: null, rejectionReason: null };
    }
  }

  const [row] = await db
    .update(products)
    .set({ ...data, ...resubmit, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  if (!row) throw AppError.notFound('Product not found');
  return row;
}

export async function deleteProduct(id: number) {
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (!row) throw AppError.notFound('Product not found');
}

export async function approveProduct(id: number, reviewerId: number) {
  return db.transaction(async (tx) => {
    const [product] = await tx.select().from(products).where(eq(products.id, id)).for('update');
    if (!product) throw AppError.notFound('Product not found');
    if (product.approvalStatus === 'approved') throw AppError.conflict('Product is already approved');

    const [updated] = await tx
      .update(products)
      .set({ approvalStatus: 'approved', reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: null, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  });
}

export async function rejectProduct(id: number, reviewerId: number, reason: string) {
  return db.transaction(async (tx) => {
    const [product] = await tx.select().from(products).where(eq(products.id, id)).for('update');
    if (!product) throw AppError.notFound('Product not found');
    if (product.approvalStatus === 'rejected') throw AppError.conflict('Product is already rejected');

    const [updated] = await tx
      .update(products)
      .set({ approvalStatus: 'rejected', rejectionReason: reason, reviewedBy: reviewerId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  });
}
