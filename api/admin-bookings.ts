import { getSupabase } from './_supabase';
import { ADMIN_PASSWORD } from '../src/admin/config';
import { toBooking, BOOKING_STATUSES, type BookingRow } from './_bookings';
import { notify } from './_notify';

/**
 * Backs the admin panel's Bookings tab (src/admin/BookingsCalendar.tsx).
 *
 *   GET    /api/admin-bookings?month=YYYY-MM        → { bookings: Booking[] }
 *   PATCH  /api/admin-bookings { id, status?, driverId? } → { booking: Booking }
 *
 * Protected by the same password as the admin panel's sign-in screen, sent
 * as an `x-admin-token` header. This is the same "casual gate" already
 * documented in src/admin/config.ts — good enough to stop casual visitors
 * from poking at customer data, not a substitute for real auth. If you
 * change ADMIN_PASSWORD there, it takes effect here automatically since
 * both read the same constant.
 *
 * A status change to confirmed/cancelled, or assigning/reassigning a
 * driver, sends a best-effort email to the business inbox and (if one's
 * assigned) the driver — see api/_notify.ts.
 */

interface UpdatePayload {
  id?: string;
  status?: string;
  /** Vehicle driver id to assign, or null to unassign. Omit to leave as-is. */
  driverId?: string | null;
}

const SERVICE_LABELS: Record<string, string> = {
  rental: 'Car Rental',
  transfer: 'Transfer',
  tour: 'Tour',
};

function tripSummaryLines(b: ReturnType<typeof toBooking>): string[] {
  const lines = [`Customer: ${b.name} (${b.phone}, ${b.email})`, `Service: ${SERVICE_LABELS[b.serviceType] || b.serviceType}`];
  if (b.pickupLoc) lines.push(`Pick-up: ${b.pickupLoc}${b.pickupDate ? ` on ${b.pickupDate} ${b.pickupTime || ''}`.trimEnd() : ''}`);
  if (b.dropoffLoc) lines.push(`Drop-off: ${b.dropoffLoc}${b.dropoffDate ? ` on ${b.dropoffDate} ${b.dropoffTime || ''}`.trimEnd() : ''}`);
  if (b.carType) lines.push(`Vehicle: ${b.carType}`);
  if (b.notes) lines.push(`Notes: ${b.notes}`);
  return lines;
}

export default {
  async fetch(request: Request) {
    if (request.headers.get('x-admin-token') !== ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json(
        { error: 'Booking storage isn’t set up yet — see supabase/schema.sql and .env.example.' },
        { status: 500 },
      );
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const month = url.searchParams.get('month'); // 'YYYY-MM'

      let query = db
        .from('bookings')
        .select('*, drivers(name, email, phone)')
        .order('pickup_date', { ascending: true, nullsFirst: false });

      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split('-').map(Number);
        const start = `${month}-01`;
        const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
        query = query.gte('pickup_date', start).lt('pickup_date', nextMonth);
      }

      const { data, error } = await query;
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
      if (!body.id) {
        return Response.json({ error: 'id is required.' }, { status: 400 });
      }
      if (body.status !== undefined && !BOOKING_STATUSES.includes(body.status as (typeof BOOKING_STATUSES)[number])) {
        return Response.json({ error: 'status must be pending, confirmed or cancelled.' }, { status: 400 });
      }

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.status !== undefined) update.status = body.status;
      if (body.driverId !== undefined) {
        update.assigned_driver_id = body.driverId;
        // Assigning to a fresh driver restarts their trip workflow.
        update.trip_status = 'pickup_pending';
      }

      const { data, error } = await db
        .from('bookings')
        .update(update)
        .eq('id', body.id)
        .select('*, drivers(name, email, phone)')
        .maybeSingle();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (!data) return Response.json({ error: 'Booking not found.' }, { status: 404 });

      const booking = toBooking(data as BookingRow);

      if (body.status === 'confirmed' || body.status === 'cancelled') {
        void notify({
          subject: `Booking ${body.status} — ${booking.name}`,
          lines: [`This booking was marked ${body.status.toUpperCase()}.`, '', ...tripSummaryLines(booking)],
          driverEmail: booking.driverName ? data.drivers?.email : null,
        });
      } else if (body.driverId !== undefined && body.driverId) {
        void notify({
          subject: `New driver assignment — ${booking.name}`,
          lines: [`You've been assigned to a booking.`, '', ...tripSummaryLines(booking)],
          driverEmail: data.drivers?.email,
        });
      }

      return Response.json({ booking });
    }

    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, PATCH' } });
  },
};
