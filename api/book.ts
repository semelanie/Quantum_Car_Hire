import { Resend } from 'resend';

/**
 * Handles booking-request submissions from the "Request this booking" form
 * (src/components/BookingModal.tsx). Vercel deploys any file under /api as a
 * function automatically — no extra config needed. See the "Booking
 * requests & email" section of the README for how to configure this (a
 * Resend account + API key, and — to send real confirmation emails to
 * customers rather than just to yourself — a verified sending domain).
 *
 * This is a request/inquiry flow, not a payment flow: no card details are
 * collected or processed anywhere in this project.
 */

interface BookingPayload {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  serviceType?: string;
  pickupLoc?: string;
  dropoffLoc?: string;
  otherAddress?: string;
  carType?: string;
  passengers?: number;
  pickupDate?: string;
  pickupTime?: string;
  dropoffDate?: string;
  dropoffTime?: string;
  babySeat?: boolean;
  /** Honeypot field — real visitors never see or fill this in. */
  website?: string;
}

const SERVICE_LABELS: Record<string, string> = {
  rental: 'Car Rental',
  transfer: 'Transfer',
  tour: 'Tour',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function locationLine(label: string, loc: string | undefined, otherAddress: string | undefined): string {
  if (!loc) return `${label}: —`;
  if (loc === 'Other address' && otherAddress) return `${label}: ${otherAddress}`;
  return `${label}: ${loc}`;
}

function summaryLines(b: BookingPayload): string[] {
  const serviceLabel = (b.serviceType && SERVICE_LABELS[b.serviceType]) || b.serviceType || '—';
  const lines = [`Service: ${serviceLabel}`, locationLine('Pick-up', b.pickupLoc, b.otherAddress)];

  if (b.serviceType === 'rental') {
    lines.push(locationLine('Drop-off', b.dropoffLoc, b.otherAddress));
  }
  if (b.carType) lines.push(`Vehicle: ${b.carType}`);
  if (b.passengers) lines.push(`Passengers: ${b.passengers}`);

  const pickup = [b.pickupDate, b.pickupTime].filter(Boolean).join(' ');
  lines.push(`Pick-up date/time: ${pickup || '—'}`);
  if (b.dropoffDate || b.dropoffTime) {
    const dropoff = [b.dropoffDate, b.dropoffTime].filter(Boolean).join(' ');
    lines.push(`Drop-off date/time: ${dropoff || '—'}`);
  }
  lines.push(`Baby seat: ${b.babySeat ? 'Yes' : 'No'}`);
  if (b.notes) lines.push(`Notes: ${b.notes}`);
  return lines;
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    let body: BookingPayload;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Bots fill every field, including ones humans never see — pretend
    // success without sending anything.
    if (body.website) {
      return Response.json({ ok: true });
    }

    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();

    if (!name || !email || !phone) {
      return Response.json({ error: 'Please fill in your name, email and phone number.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: "That email address doesn't look right." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set — see .env.example / README.');
      return Response.json(
        { error: 'Booking requests are not set up on this site yet — please message us on WhatsApp instead.' },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);
    const businessEmail = process.env.BOOKING_NOTIFY_EMAIL || 'info@quantumcarhire.com';
    // Resend's shared sandbox address until BOOKING_FROM_EMAIL is set to a
    // verified domain — see the README for why this matters for customer
    // confirmation emails specifically.
    const fromAddress = process.env.BOOKING_FROM_EMAIL || 'Quantum Car Hire <onboarding@resend.dev>';
    const lines = summaryLines(body);

    const { error: notifyError } = await resend.emails.send({
      from: fromAddress,
      to: businessEmail,
      replyTo: email,
      subject: `New booking request — ${name}`,
      text: [`New booking request from ${name} (${email}, ${phone})`, '', ...lines].join('\n'),
    });

    if (notifyError) {
      console.error('Failed to send booking notification:', notifyError);
      return Response.json(
        { error: 'Could not send your request right now — please try WhatsApp instead.' },
        { status: 502 },
      );
    }

    // Best-effort customer confirmation: the business already has the
    // request at this point, so a failure here doesn't fail the request —
    // it just gets logged.
    const { error: confirmError } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "We've received your booking request — Quantum Car Hire",
      text: [
        `Hi ${name},`,
        '',
        "Thanks for your request! Here's what you sent us:",
        '',
        ...lines,
        '',
        "We'll check availability and confirm by email or WhatsApp shortly. If it's urgent, message us any time on WhatsApp: +248 2599 333.",
        '',
        '— Quantum Car Hire',
      ].join('\n'),
    });
    if (confirmError) {
      console.error('Failed to send customer confirmation:', confirmError);
    }

    return Response.json({ ok: true });
  },
};
