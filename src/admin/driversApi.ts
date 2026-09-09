import { ADMIN_PASSWORD } from './config';
import type { Driver } from '../types/driver';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_PASSWORD,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export function fetchDrivers(): Promise<{ drivers: Driver[] }> {
  return request('/api/admin-drivers');
}

export function createDriver(input: { name: string; email: string; phone: string; password: string }): Promise<{ driver: Driver }> {
  return request('/api/admin-drivers', { method: 'POST', body: JSON.stringify(input) });
}

export function updateDriver(
  id: string,
  patch: Partial<{ name: string; phone: string; active: boolean; password: string }>,
): Promise<{ driver: Driver }> {
  return request('/api/admin-drivers', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) });
}
