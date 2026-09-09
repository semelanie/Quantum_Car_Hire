import { ADMIN_PASSWORD } from './config';
import type { Booking, BookingStatus } from '../types/booking';

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

/** month: 'YYYY-MM' */
export function fetchBookings(month: string): Promise<{ bookings: Booking[] }> {
  return request(`/api/admin-bookings?month=${encodeURIComponent(month)}`);
}

export function updateBookingStatus(id: string, status: BookingStatus): Promise<{ booking: Booking }> {
  return request('/api/admin-bookings', {
    method: 'PATCH',
    body: JSON.stringify({ id, status }),
  });
}

/** Pass driverId: null to unassign. */
export function assignBookingDriver(id: string, driverId: string | null): Promise<{ booking: Booking }> {
  return request('/api/admin-bookings', {
    method: 'PATCH',
    body: JSON.stringify({ id, driverId }),
  });
}
