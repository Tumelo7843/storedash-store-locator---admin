import type { Order, Paginated, Product, Service, Store, StoreOwnerApplication, UserProfile } from '@storedash/shared';
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

async function request<T>(path: string, options: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(withAuth ? await authHeaders() : {}),
  };

  const res = await fetch(`${env.apiUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // non-JSON error response (e.g. gateway timeout HTML page)
    }
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface StoreListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
}

function toQuery<T extends object>(params: T): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
}

interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function fetchStores(params: StoreListParams = {}): Promise<Paginated<Store>> {
  const { data, pagination } = await request<{ data: Store[]; pagination: ApiPagination }>(`/api/stores${toQuery(params)}`);
  return { items: data, ...pagination };
}

export async function fetchStore(id: number): Promise<Store> {
  const { data } = await request<{ data: Store }>(`/api/stores/${id}`);
  return data;
}

export async function fetchProducts(params: { storeId?: number; search?: string; category?: string; page?: number; limit?: number } = {}) {
  const { data, pagination } = await request<{ data: Product[]; pagination: ApiPagination }>(`/api/products${toQuery(params)}`);
  return { items: data, ...pagination };
}

export async function fetchServices(params: { storeId?: number; search?: string; category?: string; page?: number; limit?: number } = {}) {
  const { data, pagination } = await request<{ data: Service[]; pagination: ApiPagination }>(`/api/services${toQuery(params)}`);
  return { items: data, ...pagination };
}

export async function syncProfile(): Promise<UserProfile> {
  const { data } = await request<{ data: UserProfile }>('/api/auth/sync', { method: 'POST' }, true);
  return data;
}

export async function updateMyProfile(data: { name?: string; phone?: string }): Promise<UserProfile> {
  const { data: profile } = await request<{ data: UserProfile }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }, true);
  return profile;
}

export interface StoreOwnerApplicationInput {
  businessName: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export async function submitStoreOwnerApplication(data: StoreOwnerApplicationInput): Promise<StoreOwnerApplication> {
  const { data: application } = await request<{ data: StoreOwnerApplication }>(
    '/api/store-owner-applications',
    { method: 'POST', body: JSON.stringify(data) },
    true,
  );
  return application;
}

export async function fetchMyApplications(): Promise<StoreOwnerApplication[]> {
  const { data } = await request<{ data: StoreOwnerApplication[] }>('/api/store-owner-applications/mine', {}, true);
  return data;
}

export async function placeOrder(storeId: number, items: Array<{ productId: number; quantity: number }>): Promise<Order> {
  const { data } = await request<{ data: Order }>('/api/orders', { method: 'POST', body: JSON.stringify({ storeId, items }) }, true);
  return data;
}

export async function fetchMyOrders(): Promise<Paginated<Order>> {
  const { data, pagination } = await request<{ data: Order[]; pagination: ApiPagination }>('/api/orders/mine?limit=50', {}, true);
  return { items: data, ...pagination };
}

export async function fetchMyOrder(id: number): Promise<Order> {
  const { data } = await request<{ data: Order }>(`/api/orders/mine/${id}`, {}, true);
  return data;
}
