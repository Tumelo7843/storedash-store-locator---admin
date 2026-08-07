import type { OpeningHours, Order, OrderItem, Product, ProductAvailability, Service, Store } from '@storedash/shared';
import type { orderItems, orders, products, services, stores } from '../db/schema.js';

type StoreRow = typeof stores.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type ServiceRow = typeof services.$inferSelect;
type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

const numOrNull = (v: string | null): number | null => (v === null ? null : Number(v));

export function toStoreDTO(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    lat: numOrNull(row.lat),
    lng: numOrNull(row.lng),
    phone: row.phone,
    email: row.email,
    imageUrl: row.imageUrl,
    bannerUrl: row.bannerUrl,
    status: row.status,
    deliveryAvailable: row.deliveryAvailable,
    pickupAvailable: row.pickupAvailable,
    openingHours: (row.openingHours as OpeningHours | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function deriveAvailability(stock: number, isActive: boolean): ProductAvailability {
  if (!isActive || stock <= 0) return 'out_of_stock';
  if (stock <= 10) return 'low_stock';
  return 'in_stock';
}

export function toProductDTO(row: ProductRow): Product {
  return {
    id: row.id,
    storeId: row.storeId,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    price: Number(row.price),
    stock: row.stock,
    availability: deriveAvailability(row.stock, row.isActive),
    isActive: row.isActive,
    imageUrl: row.imageUrl,
    description: row.description,
    unit: row.unit,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toServiceDTO(row: ServiceRow): Service {
  return {
    id: row.id,
    storeId: row.storeId,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    durationMinutes: row.durationMinutes,
    isActive: row.isActive,
    imageUrl: row.imageUrl,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toOrderItemDTO(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    productName: row.productName,
    unitPrice: Number(row.unitPrice),
    quantity: row.quantity,
    lineTotal: Number(row.lineTotal),
  };
}

export function toOrderDTO(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    storeId: row.storeId,
    userId: row.userId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    items: items.map(toOrderItemDTO),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
