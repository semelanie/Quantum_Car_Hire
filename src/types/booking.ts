export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type TripStatus = 'pickup_pending' | 'picked_up' | 'in_transit' | 'dropped_off' | 'completed';

/** A stored booking request, as returned by /api/admin-bookings and /api/driver-bookings. */
export interface Booking {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: BookingStatus;

  name: string;
  email: string;
  phone: string;
  notes: string;

  serviceType: 'rental' | 'transfer' | 'tour' | string;
  pickupLoc: string;
  dropoffLoc: string;
  carType: string;
  passengers: number | null;

  /** 'YYYY-MM-DD', or '' if the customer didn't pick one. */
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;

  babySeat: boolean;

  /** Driver assignment — set by the admin panel, progressed by the driver. */
  assignedDriverId: string | null;
  tripStatus: TripStatus;
  driverName: string | null;
  driverPhone: string | null;
}
