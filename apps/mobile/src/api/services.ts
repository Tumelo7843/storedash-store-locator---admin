import type { Paginated, Service } from '@storedash/shared';
import { ApiPagination, request, toQuery } from './client';

export interface ServiceListParams {
  storeId?: number;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function fetchServices(params: ServiceListParams = {}): Promise<Paginated<Service>> {
  const { data, pagination } = await request<{ data: Service[]; pagination: ApiPagination }>(`/api/services${toQuery(params)}`);
  return { items: data, ...pagination };
}
