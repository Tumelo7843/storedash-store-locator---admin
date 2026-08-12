import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { storeAdmins, storeOwnerApplications, stores, users } from '../db/schema.js';
import { AppError } from '../utils/errors.js';
import type { z } from 'zod';
import type { createApplicationSchema } from '../validators/storeOwnerApplications.validator.js';

type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export async function createApplication(userId: number, data: CreateApplicationInput) {
  const [existingPending] = await db
    .select({ id: storeOwnerApplications.id })
    .from(storeOwnerApplications)
    .where(and(eq(storeOwnerApplications.userId, userId), eq(storeOwnerApplications.status, 'pending')))
    .limit(1);
  if (existingPending) {
    throw AppError.conflict('You already have a pending store-owner application. Please wait for it to be reviewed.');
  }

  const [row] = await db.insert(storeOwnerApplications).values({ ...data, userId }).returning();
  return row;
}

export async function listMyApplications(userId: number) {
  return db
    .select()
    .from(storeOwnerApplications)
    .where(eq(storeOwnerApplications.userId, userId))
    .orderBy(desc(storeOwnerApplications.createdAt));
}

export async function listApplications(status?: 'pending' | 'approved' | 'rejected') {
  const rows = await db
    .select({
      application: storeOwnerApplications,
      applicantEmail: users.email,
      applicantName: users.name,
    })
    .from(storeOwnerApplications)
    .innerJoin(users, eq(storeOwnerApplications.userId, users.id))
    .where(status ? eq(storeOwnerApplications.status, status) : undefined)
    .orderBy(desc(storeOwnerApplications.createdAt));

  return rows.map((r) => ({ ...r.application, applicantEmail: r.applicantEmail, applicantName: r.applicantName }));
}

export async function getApplicationById(id: number) {
  const [row] = await db.select().from(storeOwnerApplications).where(eq(storeOwnerApplications.id, id)).limit(1);
  if (!row) throw AppError.notFound('Application not found');
  return row;
}

// Approving an application is the ONLY path (besides direct DB access) that
// can turn a customer into a store_admin — it creates the store from the
// application's own submitted business info (never re-trusting the request
// body), links the applicant as its first admin, and upgrades their role, all
// in one transaction so a partial approval can never happen.
export async function approveApplication(applicationId: number, reviewerId: number) {
  return db.transaction(async (tx) => {
    const [application] = await tx
      .select()
      .from(storeOwnerApplications)
      .where(eq(storeOwnerApplications.id, applicationId))
      .for('update');
    if (!application) throw AppError.notFound('Application not found');
    if (application.status !== 'pending') throw AppError.conflict(`Application is already ${application.status}`);

    // approvalStatus is set to 'approved' here, not left at the column
    // default ('pending') — a super_admin approving this application IS the
    // review; the resulting store shouldn't need a second, redundant pass
    // through the store-approval queue (see approvals.service.ts).
    const [store] = await tx
      .insert(stores)
      .values({
        name: application.businessName,
        category: application.category,
        description: application.description,
        address: application.address,
        city: application.city,
        state: application.state,
        postalCode: application.postalCode,
        country: application.country,
        phone: application.phone,
        email: application.email,
        approvalStatus: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .returning();

    await tx.insert(storeAdmins).values({ userId: application.userId, storeId: store.id }).onConflictDoNothing();

    await tx
      .update(users)
      .set({ role: 'store_admin' })
      .where(and(eq(users.id, application.userId), eq(users.role, 'customer')));

    const [updatedApplication] = await tx
      .update(storeOwnerApplications)
      .set({ status: 'approved', storeId: store.id, reviewedBy: reviewerId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(storeOwnerApplications.id, applicationId))
      .returning();

    return { application: updatedApplication, store };
  });
}

export async function rejectApplication(applicationId: number, reviewerId: number, reason: string) {
  return db.transaction(async (tx) => {
    const [application] = await tx
      .select()
      .from(storeOwnerApplications)
      .where(eq(storeOwnerApplications.id, applicationId))
      .for('update');
    if (!application) throw AppError.notFound('Application not found');
    if (application.status !== 'pending') throw AppError.conflict(`Application is already ${application.status}`);

    const [updated] = await tx
      .update(storeOwnerApplications)
      .set({ status: 'rejected', rejectionReason: reason, reviewedBy: reviewerId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(storeOwnerApplications.id, applicationId))
      .returning();
    return updated;
  });
}
