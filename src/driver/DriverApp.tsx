import { useEffect, useState } from 'react';
import { fetchMyBookings, updateTripStatus } from './driverBookingsApi';
import { readDriverSession, clearDriverSession } from './driverAuth';
import type { Booking, TripStatus } from '../types/booking';

interface DriverAppProps {
  onLogout: () => void;
}

const TRIP_STATUS_ORDER: TripStatus[] = ['pickup_pending', 'picked_up', 'in_transit', 'dropped_off', 'completed'];
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

function formatDateHeading(dateStr: string | null): string {
  if (!dateStr) return 'No date given';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DriverApp({ onLogout }: DriverAppProps) {
  const session = readDriverSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchMyBookings()
      .then(({ bookings }) => setBookings(bookings))
      .catch((err: Error) => {
        setError(err.message);
        if (err.message.toLowerCase().includes('sign in')) onLogout();
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleLogout() {
    clearDriverSession();
    onLogout();
  }

  async function handleStatusChange(booking: Booking, status: TripStatus) {
    if (status === booking.tripStatus) return;
    setUpdatingId(booking.id);
    const prev = bookings;
    setBookings((list) => list.map((b) => (b.id === booking.id ? { ...b, tripStatus: status } : b)));
    try {
      await updateTripStatus(booking.id, status);
    } catch (err) {
      setBookings(prev);
      setError(err instanceof Error ? err.message : 'Could not update — try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  const groups: { date: string | null; items: Booking[] }[] = [];
  for (const b of bookings) {
    const key = b.pickupDate || null;
    let group = groups.find((g) => g.date === key);
    if (!group) {
      group = { date: key, items: [] };
      groups.push(group);
    }
    group.items.push(b);
  }

  return (
    <div className="driver-app">
      <header className="driver-topbar">
        <div>
          <span className="eyebrow">Quantum Car Hire</span>
          <h1>Hi, {session?.name.split(' ')[0] ?? 'driver'}</h1>
        </div>
        <button className="btn btn-ghost" type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="driver-content">
        {error && <p className="admin-field-error">{error}</p>}
        {loading ? (
          <p className="cal-detail-empty">Loading your bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="cal-detail-empty">No bookings assigned to you yet.</p>
        ) : (
          groups.map((group) => (
            <section className="driver-day-group" key={group.date ?? 'none'}>
              <h2>{formatDateHeading(group.date)}</h2>
              {group.items.map((b) => (
                <div className="driver-booking-card" key={b.id}>
                  <div className="driver-booking-head">
                    <span className="booking-card-name">{b.name}</span>
                    <span className="booking-card-service">{SERVICE_LABELS[b.serviceType] || b.serviceType}</span>
                  </div>
                  <div className="booking-card-grid">
                    <span>
                      <b>Pick-up</b> {b.pickupTime || '—'} — {b.pickupLoc || '—'}
                    </span>
                    {b.serviceType === 'rental' && (
                      <span>
                        <b>Drop-off</b> {b.dropoffDate || b.pickupDate} {b.dropoffTime || ''} — {b.dropoffLoc || '—'}
                      </span>
                    )}
                    {b.carType && (
                      <span>
                        <b>Vehicle</b> {b.carType}
                      </span>
                    )}
                    {b.babySeat && (
                      <span>
                        <b>Extras</b> Baby car seat
                      </span>
                    )}
                  </div>
                  {b.notes && <p className="booking-card-notes">“{b.notes}”</p>}
                  <div className="driver-booking-contact">
                    <a href={`tel:${b.phone}`}>{b.phone}</a>
                    <a href={`https://wa.me/${b.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </div>
                  <div className="trip-status-buttons">
                    {TRIP_STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`booking-status-btn${b.tripStatus === s ? ' active' : ''}`}
                        disabled={updatingId === b.id}
                        onClick={() => handleStatusChange(b, s)}
                      >
                        {TRIP_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
