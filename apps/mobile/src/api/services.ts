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

export async function fetchService(id: number): Promise<Service> {
  const { data } = await request<{ data: Service }>(`/api/services/${id}`);
  return data;
}
