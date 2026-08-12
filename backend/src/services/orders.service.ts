import { and, asc, count, desc, eq, gte, inArray, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orderItems, orders, products, stores } from '../db/schema.js';
import type { DbUser } from './users.service.js';
import { AppError } from '../utils/errors.js';

export interface PlaceOrderItemInput {
  productId: number;
  quantity: number;
}

// Computes prices from the current product rows in the database — the
// client only supplies productId + quantity, never a price. This is what
// prevents a customer from tampering with order totals.
export async function placeOrder(user: DbUser, storeId: number, items: PlaceOrderItemInput[]) {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store || store.status !== 'active' || store.approvalStatus !== 'approved') throw AppError.notFound('Store not found');

  const productIds = items.map((i) => i.productId);
  const productRows = await db.select().from(products).where(inArray(products.id, productIds));
  const productById = new Map(productRows.map((p) => [p.id, p]));

  let totalAmount = 0;
  const lineItems: (typeof orderItems.$inferInsert)[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || product.storeId !== storeId) {
      throw AppError.badRequest(`Product ${item.productId} is not available at this store`);
    }
    if (!product.isActive || product.approvalStatus !== 'approved') {
      throw AppError.badRequest(`Product ${item.productId} is not available at this store`);
    }
    if (product.stock < item.quantity) {
      throw AppError.conflict(`"${product.name}" does not have enough stock (requested ${item.quantity}, available ${product.stock})`);
    }
    const unitPrice = Number(product.price);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    totalAmount += lineTotal;
    lineItems.push({
      orderId: 0, // set after order insert, inside the transaction
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: lineTotal.toFixed(2),
    });
  }

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        storeId,
        userId: user.id,
        customerName: user.name || user.email,
        customerEmail: user.email,
        status: 'pending',
        totalAmount: totalAmount.toFixed(2),
      })
      .returning();

    const insertedItems = await tx
      .insert(orderItems)
      .values(lineItems.map((li) => ({ ...li, orderId: order.id })))
      .returning();

    // Decrement stock for each purchased product.
    for (const item of items) {
      const product = productById.get(item.productId)!;
      await tx
        .update(products)
        .set({ stock: product.stock - item.quantity, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }

    return { order, items: insertedItems };
  });
}

export async function getOrderItems(orderId: number) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export interface ListOrdersParams {
  page: number;
  limit: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  storeId?: number;
  userId?: number;
  restrictToStoreIds?: number[] | 'all';
}

export async function listOrders(params: ListOrdersParams) {
  const conditions: SQL[] = [];
  if (params.status) conditions.push(eq(orders.status, params.status));
  if (params.storeId) conditions.push(eq(orders.storeId, params.storeId));
  if (params.userId) conditions.push(eq(orders.userId, params.userId));
  if (params.restrictToStoreIds && params.restrictToStoreIds !== 'all') {
    if (params.restrictToStoreIds.length === 0) return { rows: [], total: 0 };
    conditions.push(inArray(orders.storeId, params.restrictToStoreIds));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db.select({ value: count() }).from(orders).where(where),
  ]);

  return { rows, total };
}

export async function getOrderById(id: number) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) throw AppError.notFound('Order not found');
  return row;
}

export async function updateOrderStatus(id: number, status: 'pending' | 'processing' | 'completed' | 'cancelled') {
  const [row] = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  if (!row) throw AppError.notFound('Order not found');
  return row;
}

export async function getRecentOrdersForStore(storeId: number, limitCount = 5) {
  return db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt)).limit(limitCount);
}

export async function getSalesByDay(storeId: number, sinceDate: Date) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.storeId, storeId), gte(orders.createdAt, sinceDate)))
    .orderBy(asc(orders.createdAt));
}
