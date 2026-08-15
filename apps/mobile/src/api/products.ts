import type { Paginated, Product } from '@storedash/shared';
import { ApiPagination, request, toQuery } from './client';

export interface ProductListParams {
  storeId?: number;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function fetchProducts(params: ProductListParams = {}): Promise<Paginated<Product>> {
  const { data, pagination } = await request<{ data: Product[]; pagination: ApiPagination }>(`/api/products${toQuery(params)}`);
  return { items: data, ...pagination };
}

export async function fetchProduct(id: number): Promise<Product> {
  const { data } = await request<{ data: Product }>(`/api/products/${id}`);
  return data;
}
