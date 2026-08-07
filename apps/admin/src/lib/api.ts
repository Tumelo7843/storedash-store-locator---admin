import type { DashboardMetrics, Order, OrderStatus, Product, Service, Store, StoreStatus, UserProfile } from '@storedash/shared';
import { auth } from './firebase';
import { env } from './env';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(await authHeaders()),
  };

  const res = await fetch(`${env.apiUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // non-JSON error response
    }
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toQuery<T extends object>(params: T): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
}

export interface ManagedProfile extends UserProfile {
  managedStoreIds: number[] | 'all';
}

export const getMe = () => request<{ data: ManagedProfile }>('/api/auth/me').then((r) => r.data);
export const syncProfile = () => request<{ data: UserProfile }>('/api/auth/sync', { method: 'POST' }).then((r) => r.data);

// ---- Stores ----
export const fetchMyStores = () => request<{ data: Store[] }>('/api/admin/stores?limit=100').then((r) => r.data);
export const createStore = (data: Partial<Store>) =>
  request<{ data: Store }>('/api/admin/stores', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data);
export const updateStore = (id: number, data: Partial<Store>) =>
  request<{ data: Store }>(`/api/admin/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.data);

export interface StoreAdminRow {
  id: number;
  userId: number;
  email: string;
  name: string | null;
  addedAt: string;
}
export const fetchStoreAdmins = (storeId: number) => request<{ data: StoreAdminRow[] }>(`/api/admin/stores/${storeId}/admins`).then((r) => r.data);
export const addStoreAdmin = (storeId: number, email: string) =>
  request(`/api/admin/stores/${storeId}/admins`, { method: 'POST', body: JSON.stringify({ email }) });
export const removeStoreAdmin = (storeId: number, userId: number) =>
  request(`/api/admin/stores/${storeId}/admins/${userId}`, { method: 'DELETE' });

// ---- Products ----
export async function fetchMyProducts(params: { storeId?: number; search?: string; page?: number; limit?: number } = {}) {
  const { data, pagination } = await request<{ data: Product[]; pagination: ApiPagination }>(`/api/admin/products${toQuery(params)}`);
  return { items: data, ...pagination };
}
export const createProduct = (data: Partial<Product> & { storeId: number }) =>
  request<{ data: Product }>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data);
export const updateProduct = (id: number, data: Partial<Product>) =>
  request<{ data: Product }>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.data);
export const deleteProduct = (id: number) => request(`/api/admin/products/${id}`, { method: 'DELETE' });

// ---- Services ----
export async function fetchMyServices(params: { storeId?: number; search?: string; page?: number; limit?: number } = {}) {
  const { data, pagination } = await request<{ data: Service[]; pagination: ApiPagination }>(`/api/admin/services${toQuery(params)}`);
  return { items: data, ...pagination };
}
export const createService = (data: Partial<Service> & { storeId: number }) =>
  request<{ data: Service }>('/api/admin/services', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data);
export const updateService = (id: number, data: Partial<Service>) =>
  request<{ data: Service }>(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.data);
export const deleteService = (id: number) => request(`/api/admin/services/${id}`, { method: 'DELETE' });

// ---- Orders ----
export async function fetchAdminOrders(params: { storeId?: number; status?: OrderStatus; page?: number; limit?: number } = {}) {
  const { data, pagination } = await request<{ data: Order[]; pagination: ApiPagination }>(`/api/admin/orders${toQuery(params)}`);
  return { items: data, ...pagination };
}
export const fetchAdminOrder = (id: number) => request<{ data: Order }>(`/api/admin/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id: number, status: OrderStatus) =>
  request<{ data: Order }>(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then((r) => r.data);

// ---- Dashboard ----
export const fetchDashboard = (storeId: number) => request<{ data: DashboardMetrics }>(`/api/admin/dashboard/${storeId}`).then((r) => r.data);

export type { StoreStatus };
