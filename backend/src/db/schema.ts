import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'store_admin', 'super_admin']);
export const storeStatusEnum = pgEnum('store_status', ['active', 'inactive']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'completed', 'cancelled']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected']);
// Distinct from applicationStatusEnum even though the values are identical:
// this gates whether a store/product/service is visible to customers at all,
// applied per-row rather than to a one-time account application. A super_admin
// creating a row is auto-approved; a store_admin's row starts pending until
// reviewed (see backend/src/services/{stores,products,storeServices}.service.ts
// approve*/reject* functions and docs/README §"Approval workflow").
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

// Firebase Auth is the identity provider; this table mirrors the subset of
// profile data the app needs plus the authorization role. Role starts as
// 'customer' for every new sign-in — 'store_admin' is granted only via the
// store-owner application approval flow (see storeOwnerApplications below and
// docs/README §"Store-owner approval workflow"), never by the client.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('customer'),
  // Super-admin kill switch, independent of role/store_admins rows: a suspended
  // user is rejected at requireAuth on every request regardless of what they'd
  // otherwise be allowed to do, without losing their role or store assignments.
  suspended: boolean('suspended').notNull().default(false),
  // Admin/super_admin only in practice (a customer has no badges to show) —
  // controls whether the Approvals/Applications pending-count badges render
  // in the admin sidebar (apps/admin/src/components/AdminLayout.tsx). Purely
  // a display preference; the underlying counts are always computed
  // server-side regardless of this setting.
  showApprovalBadges: boolean('show_approval_badges').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().default('General'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('South Africa'),
  // Nullable on purpose: stores can be created before a geocoded location exists.
  // The API and frontends must treat null lat/lng as "location unavailable", never
  // silently substitute a default coordinate.
  lat: numeric('lat', { precision: 10, scale: 7 }),
  lng: numeric('lng', { precision: 10, scale: 7 }),
  phone: text('phone'),
  email: text('email'),
  imageUrl: text('image_url'),
  bannerUrl: text('banner_url'),
  status: storeStatusEnum('status').notNull().default('active'),
  deliveryAvailable: boolean('delivery_available').notNull().default(false),
  pickupAvailable: boolean('pickup_available').notNull().default(true),
  // { mon: { open: "09:00", close: "21:00", closed: false }, ... }
  openingHours: jsonb('opening_hours'),
  // Separate from `status` above: `status` is the owner's own on/off toggle
  // for an already-approved store; `approvalStatus` is the super_admin gate
  // that must be 'approved' before it's eligible to show to customers at all,
  // regardless of `status`. See approvalStatusEnum comment.
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Many-to-many: a store can have multiple admins, an admin can manage multiple stores.
// This is the single source of truth for "who can manage store X" — every
// write to products/services/orders/store-settings must check this table
// (or the super_admin role) on the backend, never trust a client-supplied storeId.
export const storeAdmins = pgTable(
  'store_admins',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('store_admins_user_store_unique').on(table.userId, table.storeId),
    // The unique constraint above indexes (userId, storeId) with userId
    // leading, which doesn't help a lookup by storeId alone (e.g. "who
    // manages store X") — hence the separate index here.
    index('store_admins_store_id_idx').on(table.storeId),
  ],
);

// Self-service "become a store owner" requests. A customer submits business
// info once; a super_admin reviews it. Approving one is what actually grants
// store_admin — nothing here mutates users.role or store_admins directly
// except through approveApplication (backend/src/services), which never
// trusts anything the client sends beyond the storeOwnerApplications.id.
export const storeOwnerApplications = pgTable(
  'store_owner_applications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: applicationStatusEnum('status').notNull().default('pending'),
    businessName: text('business_name').notNull(),
    category: text('category').notNull().default('General'),
    description: text('description'),
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(), // Province
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull().default('South Africa'),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    // Set once approved: the store created from this application's business info.
    storeId: integer('store_id').references(() => stores.id, { onDelete: 'set null' }),
    reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('store_owner_applications_user_id_idx').on(table.userId),
    index('store_owner_applications_status_idx').on(table.status),
  ],
);

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sku: text('sku').notNull(),
    category: text('category').notNull().default('General'),
    brand: text('brand'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    imageUrl: text('image_url'),
    description: text('description'),
    unit: text('unit'),
    approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
    reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // storeId leads this composite unique index, so it also serves plain
    // "products for store X" lookups — no separate index needed.
    unique('products_store_sku_unique').on(table.storeId, table.sku),
  ],
);

export const services = pgTable(
  'services',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull().default('General'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    durationMinutes: integer('duration_minutes'),
    isActive: boolean('is_active').notNull().default(true),
    imageUrl: text('image_url'),
    description: text('description'),
    approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
    reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('services_store_id_idx').on(table.storeId)],
);

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'restrict' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    // Snapshots of the customer identity at order time, kept even if the user profile changes later.
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    // Always computed server-side from order_items at creation time — never trust a client total.
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Two independent access patterns: admins list by store, customers list
    // by their own userId — both need their own index.
    index('orders_store_id_idx').on(table.storeId),
    index('orders_user_id_idx').on(table.userId),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    // Nullable: preserves order history if a product is later deleted.
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    // Snapshot fields so historical orders remain accurate even if the product changes later.
    productName: text('product_name').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId)],
);

// ---- Relations ----

export const usersRelations = relations(users, ({ many }) => ({
  managedStores: many(storeAdmins),
  orders: many(orders),
  storeOwnerApplications: many(storeOwnerApplications),
}));

export const storeOwnerApplicationsRelations = relations(storeOwnerApplications, ({ one }) => ({
  user: one(users, { fields: [storeOwnerApplications.userId], references: [users.id], relationName: 'applicant' }),
  store: one(stores, { fields: [storeOwnerApplications.storeId], references: [stores.id] }),
  reviewer: one(users, { fields: [storeOwnerApplications.reviewedBy], references: [users.id], relationName: 'reviewer' }),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  products: many(products),
  services: many(services),
  orders: many(orders),
  admins: many(storeAdmins),
}));

export const storeAdminsRelations = relations(storeAdmins, ({ one }) => ({
  user: one(users, { fields: [storeAdmins.userId], references: [users.id] }),
  store: one(stores, { fields: [storeAdmins.storeId], references: [stores.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  orderItems: many(orderItems),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  store: one(stores, { fields: [services.storeId], references: [stores.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
