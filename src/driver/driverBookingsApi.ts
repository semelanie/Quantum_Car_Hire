import type { Booking, TripStatus } from '../types/booking';
import { readDriverSession, clearDriverSession } from './driverAuth';

class SessionExpiredError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readDriverSession();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearDriverSession();
    throw new SessionExpiredError('Your session expired — please sign in again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export async function driverLogin(email: string, password: string): Promise<{ token: string; driver: { id: string; name: string; email: string } }> {
  const res = await fetch('/api/driver-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Could not sign in.');
  }
  return data as { token: string; driver: { id: string; name: string; email: string } };
}

export function fetchMyBookings(): Promise<{ bookings: Booking[] }> {
  return request('/api/driver-bookings');
}

export function updateTripStatus(id: string, tripStatus: TripStatus): Promise<{ booking: Booking }> {
  return request('/api/driver-bookings', { method: 'PATCH', body: JSON.stringify({ id, tripStatus }) });
}
