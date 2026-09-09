/** Shared shape-mapping for bookings, used by admin-bookings.ts, driver-bookings.ts, and notify-cron.ts. */

export interface BookingRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  service_type: string;
  pickup_loc: string | null;
  dropoff_loc: string | null;
  car_type: string | null;
  passengers: number | null;
  pickup_date: string | null;
  pickup_time: string | null;
  dropoff_date: string | null;
  dropoff_time: string | null;
  baby_seat: boolean;
  assigned_driver_id: string | null;
  trip_status: string;
  drivers?: { name: string; email: string; phone: string | null } | null;
}

export function toBooking(row: BookingRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes ?? '',
    serviceType: row.service_type ?? '',
    pickupLoc: row.pickup_loc ?? '',
    dropoffLoc: row.dropoff_loc ?? '',
    carType: row.car_type ?? '',
    passengers: row.passengers ?? null,
    pickupDate: row.pickup_date ?? '',
    pickupTime: row.pickup_time ?? '',
    dropoffDate: row.dropoff_date ?? '',
    dropoffTime: row.dropoff_time ?? '',
    babySeat: Boolean(row.baby_seat),
    assignedDriverId: row.assigned_driver_id,
    tripStatus: row.trip_status,
    driverName: row.drivers?.name ?? null,
    driverPhone: row.drivers?.phone ?? null,
  };
}

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export const TRIP_STATUSES = ['pickup_pending', 'picked_up', 'in_transit', 'dropped_off', 'completed'] as const;
