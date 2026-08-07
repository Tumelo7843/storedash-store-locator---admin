import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').default('Admin User'),
  role: text('role').default('Administrator'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'stores' table
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').default('General'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').default('United States'),
  phone: text('phone'),
  managerName: text('manager_name'),
  status: text('status').default('Active'), // Active, Inactive
  rating: numeric('rating').default('4.5'),
  reviewCount: integer('review_count').default(120),
  imageUrl: text('image_url'),
  bannerUrl: text('banner_url'),
  lat: numeric('lat').default('40.7128'),
  lng: numeric('lng').default('-74.0060'),
  operatingHours: text('operating_hours'),
  website: text('website'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'products' table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category').notNull(),
  brand: text('brand').default('Brand'),
  price: numeric('price').notNull(),
  stock: integer('stock').notNull().default(0),
  status: text('status').notNull().default('In Stock'), // In Stock, Low Stock, Out of Stock
  imageUrl: text('image_url'),
  description: text('description'),
  unit: text('unit').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'orders' table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  totalAmount: numeric('total_amount').notNull(),
  status: text('status').default('Completed'), // Pending, Processing, Completed
  itemCount: integer('item_count').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  products: many(products),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
}));
