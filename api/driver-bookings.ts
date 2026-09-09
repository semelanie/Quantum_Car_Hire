import { getSupabase } from './_supabase';
import { bearerToken, verifyDriverToken } from './_auth';
import { toBooking, TRIP_STATUSES, type BookingRow } from './_bookings';

/**
 * The driver portal's own view (src/driver/DriverApp.tsx).
 *
 *   GET   /api/driver-bookings            → { bookings: Booking[] }
 *         Only bookings assigned to the signed-in driver, confirmed or
 *         further along — a driver never sees requests still pending
 *         admin approval.
 *   PATCH /api/driver-bookings { id, tripStatus } → { booking: Booking }
 *         A driver may only move a booking assigned to them through the
 *         trip-status workflow (Pickup Pending → Picked Up → In Transit →
 *         Dropped Off → Completed). They can't touch anyone else's booking,
 *         and can't change the admin `status` field.
 */

interface UpdatePayload {
  id?: string;
  tripStatus?: string;
}

export default {
  async fetch(request: Request) {
    const driverId = await verifyDriverToken(bearerToken(request));
    if (!driverId) {
      return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json({ error: 'The driver portal isn’t set up yet — ask your admin.' }, { status: 500 });
    }

    if (request.method === 'GET') {
      const { data, error } = await db
        .from('bookings')
        .select('*, drivers(name, email, phone)')
        .eq('assigned_driver_id', driverId)
        .neq('status', 'cancelled')
        .order('pickup_date', { ascending: true, nullsFirst: false });

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ bookings: (data ?? []).map((row) => toBooking(row as BookingRow)) });
    }

    if (request.method === 'PATCH') {
      let body: UpdatePayload;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      if (!body.id || !body.tripStatus || !TRIP_STATUSES.includes(body.tripStatus as (typeof TRIP_STATUSES)[number])) {
        return Response.json({ error: 'id and a valid trip status are required.' }, { status: 400 });
      }

      const { data, error } = await db
        .from('bookings')
        .update({ trip_status: body.tripStatus, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .eq('assigned_driver_id', driverId) // can't touch a booking that isn't theirs
        .select('*, drivers(name, email, phone)')
        .maybeSingle();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (!data) return Response.json({ error: 'Booking not found.' }, { status: 404 });
      return Response.json({ booking: toBooking(data as BookingRow) });
    }

    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, PATCH' } });
  },
};
