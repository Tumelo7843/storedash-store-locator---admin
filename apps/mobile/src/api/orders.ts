import type { Order, Paginated } from '@storedash/shared';
import { ApiPagination, request } from './client';

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
