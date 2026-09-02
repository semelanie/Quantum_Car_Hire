# How "Check availability" → booking email works

## Overview

Quantum Car Hire has no real-time inventory system, so "Check availability"
doesn't check a calendar — it collects the customer's trip details and
contact info and **emails them to the business** as a booking request, which
the owner then confirms manually (by email or WhatsApp). No payment or card
details are collected anywhere in this flow.

## The pieces

**1. "Check availability" button** (`src/components/Hero.tsx`)
Validates that a pick-up date (and drop-off date, for rentals) has been
chosen, then opens a popup form pre-filled with a summary of the configured
trip (service type, locations, vehicle, dates).

**2. The popup form** (`src/components/BookingModal.tsx`)
Asks for name, email, and phone. Includes an invisible honeypot field —
real visitors never see or fill it, but bots that auto-fill every field do,
so those submissions are silently dropped instead of generating spam email.

**3. Submitting the form**
Sends a `POST` request to `/api/book` with the trip details + contact info
as JSON.

**4. The backend** (`api/book.ts`)
A Vercel serverless function — any file under `/api` is automatically
deployed as a live backend endpoint, no separate server needed. It:
- Rejects the request if the honeypot was filled, or if name/email/phone
  are missing or invalid.
- Uses **[Resend](https://resend.com)** (a transactional email API) to send
  two emails:
  - one to the business inbox (`BOOKING_NOTIFY_EMAIL`, default
    `info@quantumcarhire.com`) with the full trip + contact details, with
    "reply-to" set to the customer's email;
  - one confirmation email back to the customer, summarizing what they
    submitted.
- Both are sent from whatever `BOOKING_FROM_EMAIL` is configured to.

**5. Back in the browser**
Shows "Sending…" while waiting; on success, swaps to a "Thanks, we've got
it" confirmation with a WhatsApp fallback link. If anything fails (Resend
error, not configured yet, etc.), it shows an error message and points the
customer to WhatsApp instead, so a request never silently disappears.

## Required setup (Vercel → Settings → Environment Variables)

| Variable | Purpose | Required? |
|---|---|---|
| `RESEND_API_KEY` | Authenticates with Resend | Yes |
| `BOOKING_NOTIFY_EMAIL` | Where business notifications go | No — defaults to `info@quantumcarhire.com` |
| `BOOKING_FROM_EMAIL` | The "from" address on both emails | No — defaults to Resend's shared sandbox address, which can only deliver to your own Resend account email until a verified domain is set here |

Changing any of these requires a **redeploy** to take effect — Vercel does
not apply env var changes to an already-live deployment automatically.
