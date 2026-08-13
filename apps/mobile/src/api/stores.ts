import type { Paginated, Store } from '@storedash/shared';
import { ApiPagination, request, toQuery } from './client';

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

export async function fetchStores(params: StoreListParams = {}): Promise<Paginated<Store>> {
  const { data, pagination } = await request<{ data: Store[]; pagination: ApiPagination }>(`/api/stores${toQuery(params)}`);
  return { items: data, ...pagination };
}

export async function fetchStore(id: number): Promise<Store> {
  const { data } = await request<{ data: Store }>(`/api/stores/${id}`);
  return data;
}
