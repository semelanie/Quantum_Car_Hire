import { useEffect, useMemo, useState } from 'react';
import { useVehicles } from '../context/VehiclesContext';
import { fetchServiceEvents, createServiceEvent, updateServiceEvent } from './serviceEventsApi';
import { fileToDataUrl } from './imageUtils';
import type { ServiceEvent } from '../types/serviceEvent';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SERVICE_TYPES = ['Service', 'Maintenance', 'Inspection', 'Insurance renewal', 'Other'];

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
function inRange(day: string, start: string, end: string): boolean {
  return day >= start && day <= end;
}
function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

function buildMonthGrid(monthStart: Date): Date[] {
  const jsDay = monthStart.getDay();
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

const emptyForm = {
  vehicleKey: '',
  registration: '',
  serviceType: SERVICE_TYPES[0],
  serviceDate: '',
  serviceTime: '',
  unavailableUntil: '',
  mileage: '',
  provider: '',
  cost: '',
  nextServiceDate: '',
  notes: '',
};

export default function ServiceCalendar() {
  const { vehicles } = useVehicles();
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => dateKey(new Date()));

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchServiceEvents({ month: monthKey(monthStart) })
      .then(({ events }) => setEvents(events))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [monthStart]);

  const days = useMemo(() => buildMonthGrid(monthStart), [monthStart]);
  const today = new Date();

  const selectedEvents = useMemo(
    () => events.filter((e) => inRange(selectedDate, e.serviceDate, e.unavailableUntil)),
    [events, selectedDate],
  );

  const upcomingSoon = useMemo(
    () => events.filter((e) => e.nextServiceDate && daysUntil(e.nextServiceDate) >= 0 && daysUntil(e.nextServiceDate) <= 14),
    [events],
  );

  function changeMonth(delta: number) {
    setMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function openNewForm() {
    setEditingId(null);
    setForm({ ...emptyForm, serviceDate: selectedDate, unavailableUntil: selectedDate, vehicleKey: vehicles[0]?.key ?? '' });
    setFiles([]);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(event: ServiceEvent) {
    setEditingId(event.id);
    setForm({
      vehicleKey: event.vehicleKey,
      registration: event.registration,
      serviceType: event.serviceType,
      serviceDate: event.serviceDate,
      serviceTime: event.serviceTime,
      unavailableUntil: event.unavailableUntil,
      mileage: event.mileage != null ? String(event.mileage) : '',
      provider: event.provider,
      cost: event.cost != null ? String(event.cost) : '',
      nextServiceDate: event.nextServiceDate ?? '',
      notes: event.notes,
    });
    setFiles([]);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const vehicle = vehicles.find((v) => v.key === form.vehicleKey);
    if (!vehicle || !form.serviceDate) {
      setFormError('Vehicle and service date are required.');
      return;
    }
    setSubmitting(true);
    try {
      const documents = await Promise.all(files.map(async (f) => ({ name: f.name, dataUrl: await fileToDataUrl(f) })));
      const payload = {
        vehicleKey: vehicle.key,
        vehicleLabel: vehicle.name,
        registration: form.registration,
        serviceType: form.serviceType,
        serviceDate: form.serviceDate,
        serviceTime: form.serviceTime,
        unavailableUntil: form.unavailableUntil || form.serviceDate,
        mileage: form.mileage ? Number(form.mileage) : null,
        provider: form.provider,
        cost: form.cost ? Number(form.cost) : null,
        nextServiceDate: form.nextServiceDate || null,
        notes: form.notes,
        documents,
      };
      if (editingId) {
        await updateServiceEvent(editingId, payload);
      } else {
        await createServiceEvent(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save that service record — try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveDocument(event: ServiceEvent, path: string) {
    try {
      await updateServiceEvent(event.id, { removeDocumentPaths: [path] });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that document.');
    }
  }

  return (
    <div className="bookings-cal">
      {upcomingSoon.length > 0 && (
        <div className="service-upcoming-banner">
          {upcomingSoon.map((e) => (
            <span key={e.id}>
              ⚠ {e.vehicleLabel} due for {e.serviceType.toLowerCase()} on {formatDate(e.nextServiceDate)}
              {daysUntil(e.nextServiceDate as string) === 0 ? ' (today)' : ` (${daysUntil(e.nextServiceDate as string)}d)`}
            </span>
          ))}
        </div>
      )}

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
        <button type="button" className="btn btn-primary" onClick={openNewForm}>
          + Log a service event
        </button>
      </div>

      {error && <p className="admin-field-error">{error}</p>}

      {showForm && (
        <form className="service-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit service record' : 'New service record'}</h3>
          <div className="service-form-grid">
            <label>
              Vehicle
              <select value={form.vehicleKey} onChange={(e) => setForm((f) => ({ ...f, vehicleKey: e.target.value }))}>
                {vehicles.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Registration
              <input value={form.registration} onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))} placeholder="S12345" />
            </label>
            <label>
              Service type
              <select value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Provider
              <input value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
            </label>
            <label>
              Service date
              <input type="date" value={form.serviceDate} onChange={(e) => setForm((f) => ({ ...f, serviceDate: e.target.value }))} required />
            </label>
            <label>
              Service time
              <input type="time" value={form.serviceTime} onChange={(e) => setForm((f) => ({ ...f, serviceTime: e.target.value }))} />
            </label>
            <label>
              Unavailable until
              <input type="date" value={form.unavailableUntil} onChange={(e) => setForm((f) => ({ ...f, unavailableUntil: e.target.value }))} />
            </label>
            <label>
              Mileage
              <input type="number" value={form.mileage} onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))} />
            </label>
            <label>
              Cost (SCR)
              <input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
            </label>
            <label>
              Next service date
              <input type="date" value={form.nextServiceDate} onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))} />
            </label>
          </div>
          <label className="service-form-notes">
            Notes
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
          <label className="service-form-notes">
            Attach documents / invoices
            <input type="file" multiple accept="application/pdf,image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
          {formError && <p className="admin-field-error">{formError}</p>}
          <div className="service-form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add record'}
            </button>
            <button className="btn btn-ghost-dark" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

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
              const dayEvents = events.filter((e) => inRange(key, e.serviceDate, e.unavailableUntil));
              const inMonth = d.getMonth() === monthStart.getMonth();
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
                  {dayEvents.length > 0 && (
                    <span className="cal-day-dots">
                      <span className="cal-dot cal-dot--service" />
                      {dayEvents.length > 1 && <span className="cal-day-count">{dayEvents.length}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-detail">
          <h3>
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {loading ? (
            <p className="cal-detail-empty">Loading…</p>
          ) : selectedEvents.length === 0 ? (
            <p className="cal-detail-empty">No vehicles in service this day.</p>
          ) : (
            <div className="cal-detail-list">
              {selectedEvents.map((event) => (
                <div className="service-card" key={event.id}>
                  <div className="service-card-head">
                    <div>
                      <span className="booking-card-name">{event.vehicleLabel}</span>
                      <span className="booking-card-service">
                        {event.serviceType}
                        {event.registration ? ` · ${event.registration}` : ''}
                      </span>
                    </div>
                    <button type="button" className="admin-link-btn" onClick={() => openEditForm(event)}>
                      Edit
                    </button>
                  </div>
                  <div className="booking-card-grid">
                    <span>
                      <b>Date</b> {formatDate(event.serviceDate)}
                      {event.serviceTime ? ` · ${event.serviceTime}` : ''}
                    </span>
                    <span>
                      <b>Unavailable until</b> {formatDate(event.unavailableUntil)}
                    </span>
                    {event.provider && (
                      <span>
                        <b>Provider</b> {event.provider}
                      </span>
                    )}
                    {event.mileage != null && (
                      <span>
                        <b>Mileage</b> {event.mileage.toLocaleString()} km
                      </span>
                    )}
                    {event.cost != null && (
                      <span>
                        <b>Cost</b> SCR {event.cost.toLocaleString()}
                      </span>
                    )}
                    {event.nextServiceDate && (
                      <span>
                        <b>Next service</b> {formatDate(event.nextServiceDate)}
                      </span>
                    )}
                  </div>
                  {event.notes && <p className="booking-card-notes">“{event.notes}”</p>}
                  {event.documents.length > 0 && (
                    <div className="service-documents">
                      {event.documents.map((doc) => (
                        <span className="service-doc-chip" key={doc.path}>
                          {doc.url ? (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              {doc.name}
                            </a>
                          ) : (
                            doc.name
                          )}
                          <button type="button" aria-label={`Remove ${doc.name}`} onClick={() => handleRemoveDocument(event, doc.path)}>
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
