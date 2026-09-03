import { useState } from 'react';
import { WhatsAppIcon } from './Icons';
import type { ServiceType } from '../types/location';

export interface TripSummary {
  serviceType: ServiceType;
  pickupLoc: string;
  dropoffLoc: string;
  carType: string;
  passengers: number;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  babySeat: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripSummary;
}

const SERVICE_LABELS: Record<ServiceType, string> = {
  rental: 'Car Rental',
  transfer: 'Transfer',
  tour: 'Tour',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

function tripLines(trip: TripSummary): { label: string; value: string }[] {
  const lines = [
    { label: 'Service', value: SERVICE_LABELS[trip.serviceType] },
    { label: 'Pick-up', value: trip.pickupLoc },
  ];
  if (trip.serviceType === 'rental') {
    lines.push({ label: 'Drop-off', value: trip.dropoffLoc });
    lines.push({ label: 'Vehicle', value: trip.carType });
  } else {
    lines.push({ label: 'Passengers', value: String(trip.passengers) });
  }
  lines.push({ label: 'Pick-up', value: [trip.pickupDate, trip.pickupTime].filter(Boolean).join(' at ') || '—' });
  if (trip.serviceType === 'rental') {
    lines.push({ label: 'Drop-off', value: [trip.dropoffDate, trip.dropoffTime].filter(Boolean).join(' at ') || '—' });
  }
  if (trip.babySeat) lines.push({ label: 'Extras', value: 'Baby car seat' });
  return lines;
}

export default function BookingModal({ isOpen, onClose, trip }: BookingModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — left empty by real visitors
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setWebsite('');
    setStatus('idle');
    setErrorMessage('');
  }

  function handleClose() {
    onClose();
    // Wait for the close transition-less overlay to actually hide before
    // wiping the form, so it doesn't visibly flash blank first.
    setTimeout(reset, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your name, email and phone number.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trip, name, email, phone, notes, website }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Something went wrong sending your request.');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong sending your request.');
    }
  }

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={handleClose}>
          &times;
        </button>

        {status === 'success' ? (
          <>
            <span className="eyebrow">Request sent</span>
            <h2>Thanks, {name.split(' ')[0]} — we&apos;ve got it</h2>
            <p style={{ color: '#5a5f66', fontSize: '0.94rem', marginTop: 10, lineHeight: 1.6 }}>
              We&apos;ll check availability and confirm by email at <strong>{email}</strong> or WhatsApp shortly. If it&apos;s
              urgent, message us any time.
            </p>
            <a
              href="https://wa.me/2482599333"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ marginTop: 18 }}
            >
              <WhatsAppIcon />
              Message us on WhatsApp
            </a>
          </>
        ) : (
          <>
            <span className="eyebrow">Request this booking</span>
            <h2>Almost there</h2>
            <p style={{ color: '#5a5f66', fontSize: '0.94rem', marginTop: 6 }}>
              Enter your details and we&apos;ll check availability and confirm by email or WhatsApp — no payment needed now.
            </p>

            <div
              style={{
                background: '#f7f8fa',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                margin: '18px 0',
                fontSize: '0.86rem',
                color: '#4a4d52',
              }}
            >
              {tripLines(trip).map((line, i) => (
                <div key={`${line.label}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
                  <span style={{ color: '#767a80' }}>{line.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--granite)', textAlign: 'right' }}>{line.value}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="booking-name">Full name</label>
                <input id="booking-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="booking-email">Email</label>
                <input id="booking-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="booking-phone">Phone / WhatsApp number</label>
                <input id="booking-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="booking-notes">Anything else we should know? (optional)</label>
                <input id="booking-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Honeypot — hidden from real visitors via CSS, not "display:none"
                  (which some bots skip), and never receives real input. */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="booking-website">Website</label>
                <input
                  id="booking-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {status === 'error' && (
                <p style={{ color: '#b3402e', fontSize: '0.84rem', marginBottom: 12 }}>
                  {errorMessage} You can also{' '}
                  <a href="https://wa.me/2482599333" target="_blank" rel="noopener noreferrer" style={{ color: '#b3402e', fontWeight: 600 }}>
                    message us on WhatsApp
                  </a>
                  .
                </p>
              )}

              <button className="btn btn-primary" type="submit" disabled={status === 'submitting'} style={{ width: '100%' }}>
                {status === 'submitting' ? 'Sending…' : 'Send booking request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
