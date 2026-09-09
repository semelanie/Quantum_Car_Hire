import { getSupabase } from './_supabase';
import { notify } from './_notify';

/**
 * Time-based reminders: upcoming/at-time pickup and drop-off, and
 * approaching vehicle service dates. Triggered by Vercel Cron (see the
 * `crons` entry in vercel.json) — NOT meant to be called from the browser.
 *
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
 * invocations when an env var named exactly CRON_SECRET is set; this
 * handler requires that to match, so nobody else can trigger it (and spam
 * "upcoming pickup" emails) by just guessing the URL.
 *
 * IMPORTANT — Vercel plan caveat: Hobby projects can only schedule a cron
 * to run once a day, which is too coarse for "reminder 1 hour before
 * pickup." Sub-daily cron schedules (e.g. every 15 minutes, configured
 * below) need a Vercel Pro plan or higher. On Hobby, either upgrade, or
 * point a free external pinger (e.g. cron-job.org) at this URL every 15
 * minutes instead, with the same CRON_SECRET as a bearer token — the
 * handler doesn't care who calls it, only that the secret matches.
 *
 * Seychelles doesn't observe DST, so pickup/drop-off times (stored as
 * plain "HH:MM" local time, no timezone) are interpreted as a fixed
 * UTC+4 offset below rather than pulling in a timezone library.
 */

const LOCAL_UTC_OFFSET_HOURS = 4; // Indian/Mahe
const SOON_WINDOW_MINUTES = 60; // "upcoming pickup" fires this far ahead
const NOW_WINDOW_MINUTES = 20; // must be >= how often the cron actually runs
const SERVICE_REMINDER_DAYS = 7;

function combineToUtcMs(dateStr: string | null, timeStr: string | null): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, (hh || 0) - LOCAL_UTC_OFFSET_HOURS, mm || 0);
}

interface BookingReminderRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  service_type: string;
  pickup_loc: string | null;
  dropoff_loc: string | null;
  car_type: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  dropoff_date: string | null;
  dropoff_time: string | null;
  notified_pickup_soon: boolean;
  notified_pickup_now: boolean;
  notified_dropoff_soon: boolean;
  notified_dropoff_now: boolean;
  drivers?: { name: string; email: string } | null;
}

export default {
  async fetch(request: Request) {
    const secret = process.env.CRON_SECRET;
    const header = request.headers.get('authorization');
    if (!secret || header !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const now = Date.now();
    const summary = { pickupSoon: 0, pickupNow: 0, dropoffSoon: 0, dropoffNow: 0, serviceUpcoming: 0 };

    // Bound the query to "around now" (±2 days covers any reasonable
    // reminder window) rather than scanning the whole table.
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const windowEndIso = new Date(now + 2 * 86_400_000).toISOString().slice(0, 10);

    const { data: bookings, error } = await db
      .from('bookings')
      .select(
        'id, name, phone, email, service_type, pickup_loc, dropoff_loc, car_type, pickup_date, pickup_time, dropoff_date, dropoff_time, notified_pickup_soon, notified_pickup_now, notified_dropoff_soon, notified_dropoff_now, drivers(name, email)',
      )
      .eq('status', 'confirmed')
      .gte('pickup_date', todayIso)
      .lte('pickup_date', windowEndIso);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    for (const row of (bookings ?? []) as unknown as BookingReminderRow[]) {
      const driverEmail = row.drivers?.email ?? null;
      const pickupMs = combineToUtcMs(row.pickup_date, row.pickup_time);
      const dropoffMs = combineToUtcMs(row.dropoff_date, row.dropoff_time);
      const updates: Record<string, boolean> = {};

      if (pickupMs !== null) {
        const minutesUntil = (pickupMs - now) / 60_000;
        if (!row.notified_pickup_soon && minutesUntil > 0 && minutesUntil <= SOON_WINDOW_MINUTES) {
          await notify({
            subject: `Upcoming pickup — ${row.name} in ~${Math.round(minutesUntil)} min`,
            lines: [
              `Pickup coming up for ${row.name} (${row.phone}).`,
              `Location: ${row.pickup_loc || '—'}`,
              row.car_type ? `Vehicle: ${row.car_type}` : '',
            ].filter(Boolean),
            driverEmail,
          });
          updates.notified_pickup_soon = true;
          summary.pickupSoon++;
        }
        if (!row.notified_pickup_now && minutesUntil <= 0 && minutesUntil > -NOW_WINDOW_MINUTES) {
          await notify({
            subject: `Pickup time now — ${row.name}`,
            lines: [`It's pickup time for ${row.name} (${row.phone}).`, `Location: ${row.pickup_loc || '—'}`],
            driverEmail,
          });
          updates.notified_pickup_now = true;
          summary.pickupNow++;
        }
      }

      if (dropoffMs !== null) {
        const minutesUntil = (dropoffMs - now) / 60_000;
        if (!row.notified_dropoff_soon && minutesUntil > 0 && minutesUntil <= SOON_WINDOW_MINUTES) {
          await notify({
            subject: `Upcoming drop-off — ${row.name} in ~${Math.round(minutesUntil)} min`,
            lines: [`Drop-off coming up for ${row.name} (${row.phone}).`, `Location: ${row.dropoff_loc || '—'}`],
            driverEmail,
          });
          updates.notified_dropoff_soon = true;
          summary.dropoffSoon++;
        }
        if (!row.notified_dropoff_now && minutesUntil <= 0 && minutesUntil > -NOW_WINDOW_MINUTES) {
          await notify({
            subject: `Drop-off time now — ${row.name}`,
            lines: [`It's drop-off time for ${row.name} (${row.phone}).`, `Location: ${row.dropoff_loc || '—'}`],
            driverEmail,
          });
          updates.notified_dropoff_now = true;
          summary.dropoffNow++;
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.from('bookings').update(updates).eq('id', row.id);
      }
    }

    // Vehicle service reminders.
    const serviceWindowIso = new Date(now + SERVICE_REMINDER_DAYS * 86_400_000).toISOString().slice(0, 10);
    const { data: serviceEvents, error: serviceError } = await db
      .from('service_events')
      .select('id, vehicle_label, service_type, next_service_date, notified_upcoming')
      .eq('notified_upcoming', false)
      .not('next_service_date', 'is', null)
      .gte('next_service_date', todayIso)
      .lte('next_service_date', serviceWindowIso);

    if (!serviceError) {
      for (const event of serviceEvents ?? []) {
        await notify({
          subject: `Upcoming service — ${event.vehicle_label}`,
          lines: [`${event.vehicle_label} is due for ${event.service_type.toLowerCase()} on ${event.next_service_date}.`],
        });
        await db.from('service_events').update({ notified_upcoming: true }).eq('id', event.id);
        summary.serviceUpcoming++;
      }
    }

    return Response.json({ ok: true, ...summary });
  },
};
