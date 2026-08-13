import type { UserProfile } from '@storedash/shared';
import { request } from './client';

export async function syncProfile(): Promise<UserProfile> {
  const { data } = await request<{ data: UserProfile }>('/api/auth/sync', { method: 'POST' }, true);
  return data;
}

export async function updateMyProfile(data: { name?: string; phone?: string }): Promise<UserProfile> {
  const { data: profile } = await request<{ data: UserProfile }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }, true);
  return profile;
}

export async function deleteMyAccount(): Promise<{ hardDeleted: boolean }> {
  const { data } = await request<{ data: { hardDeleted: boolean } }>('/api/auth/me', { method: 'DELETE' }, true);
  return data;
}
