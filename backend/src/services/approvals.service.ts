import { count, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, services, storeOwnerApplications, stores } from '../db/schema.js';

// Backs the Super Admin's notification badge (AdminLayout polls this). Counts
// only — the actual pending rows are fetched by the Approvals/Applications
// pages themselves via their own filtered list endpoints.
export async function getApprovalSummary() {
  const [[storeRow], [productRow], [serviceRow], [applicationRow]] = await Promise.all([
    db.select({ value: count() }).from(stores).where(eq(stores.approvalStatus, 'pending')),
    db.select({ value: count() }).from(products).where(eq(products.approvalStatus, 'pending')),
    db.select({ value: count() }).from(services).where(eq(services.approvalStatus, 'pending')),
    db.select({ value: count() }).from(storeOwnerApplications).where(eq(storeOwnerApplications.status, 'pending')),
  ]);

  const pendingStores = storeRow.value;
  const pendingProducts = productRow.value;
  const pendingServices = serviceRow.value;
  const pendingApplications = applicationRow.value;

  return {
    pendingStores,
    pendingProducts,
    pendingServices,
    pendingApplications,
    total: pendingStores + pendingProducts + pendingServices + pendingApplications,
  };
}
