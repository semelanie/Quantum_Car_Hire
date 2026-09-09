import { ADMIN_PASSWORD } from './config';
import type { ServiceEvent } from '../types/serviceEvent';

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

export interface ServiceEventInput {
  vehicleKey: string;
  vehicleLabel: string;
  registration?: string;
  serviceType: string;
  serviceDate: string;
  serviceTime?: string;
  unavailableUntil?: string;
  mileage?: number | null;
  provider?: string;
  cost?: number | null;
  nextServiceDate?: string | null;
  notes?: string;
  documents?: { name: string; dataUrl: string }[];
}

/** month: 'YYYY-MM'. Omit for all active (currently-unavailable) events. */
export function fetchServiceEvents(opts: { month?: string; activeOnly?: boolean } = {}): Promise<{ events: ServiceEvent[] }> {
  const params = new URLSearchParams();
  if (opts.month) params.set('month', opts.month);
  if (opts.activeOnly) params.set('activeOnly', '1');
  const qs = params.toString();
  return request(`/api/admin-service-events${qs ? `?${qs}` : ''}`);
}

export function createServiceEvent(input: ServiceEventInput): Promise<{ event: ServiceEvent; uploadErrors?: string[] }> {
  return request('/api/admin-service-events', { method: 'POST', body: JSON.stringify(input) });
}

export function updateServiceEvent(
  id: string,
  patch: Partial<ServiceEventInput> & { addDocuments?: { name: string; dataUrl: string }[]; removeDocumentPaths?: string[] },
): Promise<{ event: ServiceEvent; uploadErrors?: string[] }> {
  return request('/api/admin-service-events', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) });
}
