import { useEffect, useMemo, useState } from 'react';
import { fetchBookings, updateBookingStatus, assignBookingDriver } from './bookingsApi';
import { fetchDrivers } from './driversApi';
import type { Booking, BookingStatus, TripStatus } from '../types/booking';
import type { Driver } from '../types/driver';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};
const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pickup_pending: 'Pickup pending',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  dropped_off: 'Dropped off',
  completed: 'Completed',
};
const SERVICE_LABELS: Record<string, string> = {
  rental: 'Car rental',
  transfer: 'Transfer',
  tour: 'Tour',
};
const STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'cancelled'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

/** 6 full weeks (Mon–Sun) covering the given month, including lead/trail days. */
function buildMonthGrid(monthStart: Date): Date[] {
  const jsDay = monthStart.getDay(); // 0=Sun..6=Sat
  const mondayOffset = (jsDay + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - mondayOffset);

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDateTime(date: string, time: string): string {
  if (!date) return time || '—';
  const d = new Date(`${date}T00:00:00`);
  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return time ? `${label} · ${time}` : label;
}

export default function BookingsCalendar() {
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => dateKey(new Date()));
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    fetchDrivers()
      .then(({ drivers }) => setDrivers(drivers))
      .catch(() => {
        // Non-fatal: the calendar still works, just without driver
        // assignment until this succeeds (e.g. on a retry / reload).
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBookings(monthKey(monthStart))
      .then(({ bookings }) => {
        if (!cancelled) setBookings(bookings);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthStart]);

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!b.pickupDate) continue;
      const list = map.get(b.pickupDate) ?? [];
      list.push(b);
      map.set(b.pickupDate, list);
    }
    return map;
  }, [bookings]);

  const unscheduled = useMemo(() => bookings.filter((b) => !b.pickupDate), [bookings]);

  const counts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, cancelled: 0 };
    for (const b of bookings) c[b.status as BookingStatus]++;
    return c;
  }, [bookings]);

  const days = useMemo(() => buildMonthGrid(monthStart), [monthStart]);
  const today = new Date();
  const selectedBookings = byDate.get(selectedDate) ?? [];

  function changeMonth(delta: number) {
    setMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  async function handleStatusChange(booking: Booking, status: BookingStatus) {
    if (status === booking.status) return;
    setUpdatingId(booking.id);
    const prev = bookings;
    setBookings((list) => list.map((b) => (b.id === booking.id ? { ...b, status } : b)));
    try {
      await updateBookingStatus(booking.id, status);
    } catch (err) {
      setBookings(prev); // roll back on failure
      setError(err instanceof Error ? err.message : 'Could not update that booking — try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAssignDriver(booking: Booking, driverId: string | null) {
    if (driverId === booking.assignedDriverId) return;
    setAssigningId(booking.id);
    const prev = bookings;
    const driver = drivers.find((d) => d.id === driverId);
    setBookings((list) =>
      list.map((b) =>
        b.id === booking.id
          ? { ...b, assignedDriverId: driverId, tripStatus: 'pickup_pending', driverName: driver?.name ?? null, driverPhone: driver?.phone ?? null }
          : b,
      ),
    );
    try {
      await assignBookingDriver(booking.id, driverId);
    } catch (err) {
      setBookings(prev);
      setError(err instanceof Error ? err.message : 'Could not assign that driver — try again.');
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="bookings-cal">
      <div className="bookings-cal-summary">
        <div className="cal-month-nav">
          <button type="button" className="cal-nav-btn" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            ‹
          </button>
          <span className="cal-month-label">{monthLabel(monthStart)}</span>
          <button type="button" className="cal-nav-btn" aria-label="Next month" onClick={() => changeMonth(1)}>
            ›
          </button>
        </div>
        <div className="cal-counts">
          <span className="cal-count-item">
            <span className="cal-dot cal-dot--pending" /> {counts.pending} pending
          </span>
          <span className="cal-count-item">
            <span className="cal-dot cal-dot--confirmed" /> {counts.confirmed} confirmed
          </span>
          <span className="cal-count-item">
            <span className="cal-dot cal-dot--cancelled" /> {counts.cancelled} cancelled
          </span>
        </div>
      </div>

      {error && <p className="admin-field-error">{error}</p>}

      <div className="bookings-cal-body">
        <div className="cal-grid-wrap">
          <div className="cal-weekdays">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className={`cal-grid${loading ? ' cal-grid--loading' : ''}`}>
            {days.map((d) => {
              const key = dateKey(d);
              const dayBookings = byDate.get(key) ?? [];
              const inMonth = d.getMonth() === monthStart.getMonth();
              const statusesPresent = STATUS_ORDER.filter((s) => dayBookings.some((b) => b.status === s));
              return (
                <button
                  key={key}
                  type="button"
                  className={`cal-day${inMonth ? '' : ' cal-day--muted'}${isSameDay(d, today) ? ' cal-day--today' : ''}${
                    key === selectedDate ? ' cal-day--selected' : ''
                  }`}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="cal-day-num">{d.getDate()}</span>
                  {statusesPresent.length > 0 && (
                    <span className="cal-day-dots">
                      {statusesPresent.map((s) => (
                        <span key={s} className={`cal-dot cal-dot--${s}`} />
                      ))}
                      {dayBookings.length > 1 && <span className="cal-day-count">{dayBookings.length}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-detail">
          <h3>
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {loading ? (
            <p className="cal-detail-empty">Loading…</p>
          ) : selectedBookings.length === 0 ? (
            <p className="cal-detail-empty">No bookings for this day.</p>
          ) : (
            <div className="cal-detail-list">
              {selectedBookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  drivers={drivers}
                  updating={updatingId === b.id}
                  assigning={assigningId === b.id}
                  onStatusChange={(status) => handleStatusChange(b, status)}
                  onAssignDriver={(driverId) => handleAssignDriver(b, driverId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div className="cal-unscheduled">
          <h3>Requests without a date ({unscheduled.length})</h3>
          <div className="cal-detail-list">
            {unscheduled.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                drivers={drivers}
                updating={updatingId === b.id}
                assigning={assigningId === b.id}
                onStatusChange={(status) => handleStatusChange(b, status)}
                onAssignDriver={(driverId) => handleAssignDriver(b, driverId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  drivers,
  updating,
  assigning,
  onStatusChange,
  onAssignDriver,
}: {
  booking: Booking;
  drivers: Driver[];
  updating: boolean;
  assigning: boolean;
  onStatusChange: (status: BookingStatus) => void;
  onAssignDriver: (driverId: string | null) => void;
}) {
  return (
    <div className={`booking-card booking-card--${booking.status}`}>
      <div className="booking-card-head">
        <div>
          <span className="booking-card-name">{booking.name}</span>
          <span className="booking-card-service">{SERVICE_LABELS[booking.serviceType] || booking.serviceType}</span>
        </div>
        <div className="booking-status-buttons">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`booking-status-btn booking-status-btn--${s}${booking.status === s ? ' active' : ''}`}
              disabled={updating}
              onClick={() => onStatusChange(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {booking.status === 'confirmed' && (
        <div className="booking-driver-row">
          <label>
            Driver
            <select
              value={booking.assignedDriverId ?? ''}
              disabled={assigning}
              onChange={(e) => onAssignDriver(e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {drivers
                .filter((d) => d.active || d.id === booking.assignedDriverId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.active ? '' : ' (inactive)'}
                  </option>
                ))}
            </select>
          </label>
          {booking.assignedDriverId && <span className="trip-status-badge">{TRIP_STATUS_LABELS[booking.tripStatus]}</span>}
        </div>
      )}

      <div className="booking-card-grid">
        <span>
          <b>Pick-up</b> {formatDateTime(booking.pickupDate, booking.pickupTime)} — {booking.pickupLoc || '—'}
        </span>
        {booking.serviceType === 'rental' && (
          <span>
            <b>Drop-off</b> {formatDateTime(booking.dropoffDate, booking.dropoffTime)} — {booking.dropoffLoc || '—'}
          </span>
        )}
        {booking.carType && (
          <span>
            <b>Vehicle</b> {booking.carType}
          </span>
        )}
        {booking.passengers ? (
          <span>
            <b>Passengers</b> {booking.passengers}
          </span>
        ) : null}
        {booking.babySeat && (
          <span>
            <b>Extras</b> Baby car seat
          </span>
        )}
      </div>
      <div className="booking-card-contact">
        <a href={`tel:${booking.phone}`}>{booking.phone}</a>
        <a href={`mailto:${booking.email}`}>{booking.email}</a>
        <a href={`https://wa.me/${booking.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </div>
      {booking.notes && <p className="booking-card-notes">“{booking.notes}”</p>}
    </div>
  );
}
