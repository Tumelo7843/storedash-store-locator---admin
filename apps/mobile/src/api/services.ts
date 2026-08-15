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
  // TEMPORARY diagnostic logging while tracking down the mobile Services
  // white-screen/crash — remove once root-caused (see CLAUDE.md).
  const path = `/api/services${toQuery(params)}`;
  console.log('[fetchServices] request', { params, path });
  try {
    const { data, pagination } = await request<{ data: Service[]; pagination: ApiPagination }>(path);
    console.log('[fetchServices] response', { count: data.length, pagination, sample: data[0] });
    return { items: data, ...pagination };
  } catch (err) {
    console.error('[fetchServices] failed', err);
    throw err;
  }
}

export async function fetchService(id: number): Promise<Service> {
  console.log('[fetchService] request', { id });
  try {
    const { data } = await request<{ data: Service }>(`/api/services/${id}`);
    console.log('[fetchService] response', data);
    return data;
  } catch (err) {
    console.error('[fetchService] failed', err);
    throw err;
  }
}
