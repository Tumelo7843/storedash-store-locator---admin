import { DashboardMetrics, Product, Store, UserProfile } from '../types';
import { auth } from './firebase';

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.warn('Could not get id token:', e);
    }
  }
  return {};
}

export async function syncUserWithBackend(): Promise<UserProfile | null> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('Failed to sync user:', error);
    return null;
  }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch('/api/dashboard/metrics');
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchStores(params?: { search?: string; category?: string; status?: string }): Promise<Store[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`/api/stores?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch stores');
  const data = await res.json();
  return data.stores;
}

export async function fetchStoreById(id: number): Promise<{ store: Store; products: Product[] }> {
  const res = await fetch(`/api/stores/${id}`);
  if (!res.ok) throw new Error('Failed to fetch store details');
  return res.json();
}

export async function createStore(storeData: Partial<Store>): Promise<Store> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/stores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(storeData),
  });
  if (!res.ok) throw new Error('Failed to create store');
  const data = await res.json();
  return data.store;
}

export async function updateStore(id: number, storeData: Partial<Store>): Promise<Store> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/stores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(storeData),
  });
  if (!res.ok) throw new Error('Failed to update store');
  const data = await res.json();
  return data.store;
}

export async function fetchProducts(params?: {
  search?: string;
  category?: string;
  status?: string;
  brand?: string;
  storeId?: number;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);
  if (params?.brand) query.append('brand', params.brand);
  if (params?.storeId) query.append('storeId', params.storeId.toString());
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`/api/products?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to create product');
  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to update product');
  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: number): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      ...headers,
    },
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function submitOrder(orderData: {
  storeId: number;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  itemCount: number;
}) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Failed to submit order');
  return res.json();
}
