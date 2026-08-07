import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, products, services, stores } from '../db/schema.js';
import { getOrderItems, getRecentOrdersForStore, getSalesByDay } from './orders.service.js';
import { toOrderDTO } from '../utils/mappers.js';
import { AppError } from '../utils/errors.js';
import type { DashboardMetrics } from '@storedash/shared';

// Every number here is computed from real rows for the requested store —
// there is no hardcoded fallback. An empty store correctly shows zeros.
export async function getDashboardMetrics(storeId: number): Promise<DashboardMetrics> {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw AppError.notFound('Store not found');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    [{ value: activeProductsCount }],
    [{ value: activeServicesCount }],
    [{ value: ordersCount }],
    [revenueRow],
    salesRows,
    recentOrderRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(products).where(and(eq(products.storeId, storeId), eq(products.isActive, true))),
    db.select({ value: count() }).from(services).where(and(eq(services.storeId, storeId), eq(services.isActive, true))),
    db.select({ value: count() }).from(orders).where(eq(orders.storeId, storeId)),
    db
      .select({ total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.status, 'completed'))),
    getSalesByDay(storeId, thirtyDaysAgo),
    getRecentOrdersForStore(storeId, 5),
  ]);

  const salesByDayMap = new Map<string, number>();
  for (const order of salesRows) {
    if (order.status !== 'completed') continue;
    const day = order.createdAt.toISOString().slice(0, 10);
    salesByDayMap.set(day, (salesByDayMap.get(day) || 0) + Number(order.totalAmount));
  }
  const salesByDay = Array.from(salesByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sales]) => ({ date, sales }));

  const recentOrders = await Promise.all(
    recentOrderRows.map(async (order) => toOrderDTO(order, await getOrderItems(order.id))),
  );

  return {
    totalRevenue: Number(revenueRow?.total ?? 0),
    ordersCount,
    activeProductsCount,
    activeServicesCount,
    storeStatus: store.status,
    salesByDay,
    recentOrders,
  };
}
