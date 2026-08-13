import type { StoreOwnerApplication } from '@storedash/shared';
import { request } from './client';

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
