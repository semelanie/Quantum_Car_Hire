import { Resend } from 'resend';

/**
 * Shared email helper for booking/service notifications — used by
 * api/admin-bookings.ts (status changes, driver assignment) and
 * api/notify-cron.ts (time-based pickup/drop-off/service reminders).
 *
 * Best-effort and silent-if-unconfigured, same philosophy as api/book.ts:
 * a missing RESEND_API_KEY logs a warning and skips sending rather than
 * failing the request that triggered it (an admin marking a booking
 * Confirmed shouldn't 500 just because email isn't set up yet).
 */

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.BOOKING_FROM_EMAIL || 'Quantum Car Hire <onboarding@resend.dev>';
}

function adminEmail(): string {
  return process.env.BOOKING_NOTIFY_EMAIL || 'info@quantumcarhire.com';
}

export async function notify(opts: { subject: string; lines: string[]; driverEmail?: string | null }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY is not set — skipping notification:', opts.subject);
    return;
  }
  const text = opts.lines.join('\n');
  const recipients = new Set([adminEmail()]);
  if (opts.driverEmail) recipients.add(opts.driverEmail);

  await Promise.all(
    Array.from(recipients).map(async (to) => {
      const { error } = await resend.emails.send({ from: fromAddress(), to, subject: opts.subject, text });
      if (error) console.error('Failed to send notification email to', to, error.message);
    }),
  );
}
