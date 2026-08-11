// Types shared between the backend API and both frontend apps (customer + admin).
// Keep this file framework-agnostic: no Express, no React, no Drizzle imports.

export type UserRole = 'customer' | 'store_admin' | 'super_admin';

export type StoreStatus = 'active' | 'inactive';
export type ProductAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface DayHours {
  open: string; // "HH:MM" 24h
  close: string; // "HH:MM" 24h
  closed: boolean;
}

export type OpeningHours = {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
};

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  suspended: boolean;
  createdAt: string;
}

export interface StoreOwnerApplication {
  id: number;
  userId: number;
  status: ApplicationStatus;
  businessName: string;
  category: string;
  description: string | null;
  address: string;
  city: string;
  state: string; // Province
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  storeId: number | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Application row plus the applicant's identity, for the Super Admin review list.
export interface StoreOwnerApplicationWithApplicant extends StoreOwnerApplication {
  applicantEmail: string;
  applicantName: string | null;
}

// A store_admin/super_admin user plus the stores they manage, for the Super
// Admin "Store Owners" management page.
export interface StoreOwnerSummary {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  suspended: boolean;
  createdAt: string;
  managedStores: Array<{ id: number; name: string }>;
}

export interface Store {
  id: number;
  name: string;
  description: string | null;
  category: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  // Nullable: a store can exist without geocoded coordinates yet (see location handling docs).
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  status: StoreStatus;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  openingHours: OpeningHours | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  storeId: number;
  name: string;
  sku: string;
  category: string;
  brand: string | null;
  price: number;
  stock: number;
  // Derived server-side from stock + isActive, never stored/trusted directly.
  availability: ProductAvailability;
  isActive: boolean;
  imageUrl: string | null;
  description: string | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  storeId: number;
  name: string;
  category: string;
  price: number;
  durationMinutes: number | null;
  isActive: boolean;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  storeId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreAdmin {
  id: number;
  userId: number;
  storeId: number;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface DashboardMetrics {
  totalRevenue: number;
  ordersCount: number;
  activeProductsCount: number;
  activeServicesCount: number;
  storeStatus: StoreStatus;
  salesByDay: Array<{ date: string; sales: number }>;
  recentOrders: Order[];
}
