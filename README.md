# Quantum Car Hire

A React + TypeScript rebuild of the Quantum Car Hire (Mahé, Seychelles) landing page, converted from the original single-file HTML/CSS/JS prototype. Built with [Vite](https://vite.dev).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Scripts

- `npm run dev` — start the local dev server with hot reload
- `npm run build` — type-check with `tsc` and produce a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run Oxlint

## Project structure

```
src/
  admin/          the admin panel: editor UI, password gate, image resizing, export
  assets/         car & logo photos (extracted from the original inline base64 images)
  components/     one component per public-site section (Header, Hero, Fleet, FAQ, modals, etc.)
  context/        VehiclesContext — the single source of truth for fleet data, shared by the
                  public site and the admin panel
  data/           default vehicle fleet data and map location data
  pages/          SitePage (the public site) and AdminPage (password gate + admin panel)
  types/          shared TypeScript types
  App.tsx         router root (/ → SitePage, /admin/login → AdminPage)
  main.tsx        React entry point
  index.css       global stylesheet (converted from the original <style> block)
  driver/         the driver portal: login page, agenda view, trip-status buttons, session storage
api/
  book.ts                 booking-request endpoint: emails + stores in Supabase
  admin-bookings.ts        admin-only: list/update bookings, assign a driver
  admin-drivers.ts         admin-only: create/update driver accounts
  admin-service-events.ts  admin-only: log/update vehicle service & maintenance events
  driver-login.ts          driver sign-in, returns a session token
  driver-bookings.ts       driver-only: bookings assigned to the signed-in driver
  notify-cron.ts           scheduled job: pickup/drop-off + service-due reminder emails
  _supabase.ts             shared server-side Supabase client (service role key)
  _auth.ts                 password hashing + driver session tokens (Web Crypto)
  _bookings.ts             shared booking row → API shape mapping
  _notify.ts               shared "send a notification email" helper
supabase/
  schema.sql            run once in Supabase's SQL Editor — creates every table + storage bucket
```

## Admin panel

Go to **`/admin/login`** to edit rates, vehicle details, and photos without touching code. There's
no link to it anywhere on the public site on purpose — you just need to know (or bookmark) the
URL.

- **Password:** `quantum2026` — change it in `src/admin/config.ts`. This is a casual gate, not
  real security: the password ships inside the JavaScript bundle, so anyone who opens devtools
  can read it. It only keeps casual visitors from stumbling into the panel.
- **What you can edit per vehicle:** name, daily/weekly/monthly rate, deposit, the detail line
  and feature list shown in the "Book this car" popup, the spec badges on the fleet card, and
  the photo (upload any image — it's automatically resized before saving).
- **Where changes are saved:** in your browser only (`localStorage`), and they show up
  immediately on the live-preview site in that same browser. Nobody else — no other visitor, no
  other device — sees them until you export and deploy.
- **Publishing your changes:** click **Export vehicles.ts** in the admin panel and replace
  `src/data/vehicles.ts` with the downloaded file, then rebuild and redeploy the site. (**Export
  vehicles.json** downloads the same data as plain JSON, if that's more convenient for your
  workflow.)
- **Undo:** each vehicle card has a "Reset to default" button; "Reset all to defaults" at the
  top clears every change at once.

### Deploying with the admin route

The admin panel is a client-side route (`/admin/login`), handled by React Router. `npm run dev`
and `npm run preview` both serve it correctly out of the box. A static host needs to be told to
serve `index.html` for unknown paths (a SPA fallback / rewrite rule), otherwise a direct visit or
page refresh on `/admin/login` 404s instead of loading the app. This repo includes `vercel.json`
with that rewrite already configured, so it works out of the box on Vercel; if you ever move to a
different static host (Netlify, GitHub Pages, etc.), add the equivalent there (e.g. Netlify's
`_redirects` with `/* /index.html 200`).

## Booking calendar & Supabase

The admin panel's **Bookings** tab shows every request submitted through the site on a calendar —
click a day to see who requested what, and mark each one Pending / Confirmed / Cancelled. Unlike
the Fleet & Rates tab, this data is **not** browser-local: it's stored in a small
[Supabase](https://supabase.com) database, so every admin sees the same bookings regardless of
device or browser, and requests keep arriving even while nobody's editing the vehicles.

### Set this up (one-time)

1. **Create a free Supabase project** at [supabase.com](https://supabase.com) (the free tier is
   plenty for this).
2. **Run the schema**: open your project → **SQL Editor** → **New query**, paste the contents of
   `supabase/schema.sql` from this repo, and click **Run**. This creates the `bookings`, `drivers`
   and `service_events` tables (used by the driver portal and service calendar below) plus a
   private Storage bucket for service documents — safe to run even if you only plan to use the
   booking calendar for now.
3. **Grab your credentials**: project → **Settings → API**. You need the **Project URL** and the
   **`service_role` key** (not the `anon` key — the service role key is what lets the server-side
   booking endpoints read and write, since the table has no public policies; see the comments in
   `supabase/schema.sql` for why that's intentional).
4. **Add them to Vercel**: **Settings → Environment Variables** → add `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` with those values (Production, and Preview if you want). Redeploy
   once they're set.

Until this is set up, booking requests still get emailed as before (see below) — they just won't
appear on the calendar yet.

### Who can see it

The Bookings tab is behind the same admin password as the rest of the panel (`/admin/login`), sent
as a header on each request to `api/admin-bookings.ts`. Same caveat as the rest of the admin panel:
this is a casual gate, not real security — good enough to keep random visitors out, not a vault.

## Driver accounts & the driver portal

Drivers sign in at **`/driver/login`** to see their own agenda — a chronological list of upcoming
pickups/drop-offs grouped by day (not a month grid; on the small screens drivers actually use for
this, a scrolling agenda is easier to read than a calendar grid), each card showing the customer
name, pickup and drop-off location and time, vehicle, any extras/notes, and the customer's phone
(tap-to-call / tap-to-WhatsApp). A driver only ever sees bookings assigned to them.

- **Creating driver accounts:** there's no self-service sign-up. An admin creates each driver from
  the **Drivers** tab in the admin panel (name, email, phone, a password) — do this once per driver
  before they can sign in. The same tab can deactivate a driver (blocks sign-in without deleting
  their history) or reset a forgotten password.
- **Assigning a driver to a booking:** on the **Bookings** tab, once a booking is **Confirmed**, a
  driver dropdown appears on it. Assigning (or reassigning) a driver resets that booking's trip
  status back to **Pickup Pending**, and emails the driver + your admin inbox with the full trip
  details.
- **Trip status:** from their agenda, a driver taps through **Pickup Pending → Picked Up → In
  Transit → Dropped Off → Completed** as the trip actually happens. This is separate from the
  booking's own **Pending/Confirmed/Cancelled** status — one is "did we agree to this booking",
  the other is "where is it right now" — and both are visible together on the admin Bookings tab.
- **Setup:** requires `DRIVER_AUTH_SECRET` to be set in Vercel (see `.env.example`) — without it,
  driver sign-in fails. Everything else (the `drivers` table, RLS) comes from `supabase/schema.sql`
  along with the booking calendar's setup above.

## Notifications & the reminder cron

Beyond the immediate emails sent when a booking is confirmed/cancelled or a driver is assigned
(above), a scheduled job (`api/notify-cron.ts`) periodically checks for bookings whose pickup or
drop-off is coming up soon or happening right now, and emails a reminder to your admin inbox and
the assigned driver — each booking/event is only ever reminded once per stage, so nobody gets
spammed on every cron run. The same job checks upcoming vehicle service dates (see below) and sends
a "service due soon" reminder to your admin inbox.

- **Setup:** requires `CRON_SECRET` to be set in Vercel (see `.env.example` for how it's used) —
  Vercel automatically authenticates its own cron calls with it, so you don't wire this up
  yourself. `RESEND_API_KEY` (below) must also be set, since reminders are sent the same way as
  every other email in this app.
- **Scheduling caveat (Vercel Hobby plan):** this repo's `vercel.json` schedules the cron every 15
  minutes, but **Vercel's free Hobby plan only runs cron jobs once a day**, regardless of what the
  schedule says — sub-daily cron requires a Pro plan. If you're on Hobby and want closer-to-real-time
  reminders, use a free external pinger instead (e.g. [cron-job.org](https://cron-job.org)) to hit
  `https://yourdomain.com/api/notify-cron` every 15 minutes with an `Authorization: Bearer
  <CRON_SECRET>` header — the endpoint itself doesn't care who calls it, only that the header
  matches.

## Vehicle service & maintenance calendar

The admin panel's **Service** tab is a separate calendar for tracking servicing, maintenance,
inspections, insurance renewals and similar vehicle-related events — independent of customer
bookings. Each entry records the vehicle, service type, date/time, mileage, provider, cost, the
next service date, notes, and any supporting documents (invoices, receipts — PDFs or images, up to
8MB each).

- **"Unavailable" vehicles:** a service event has a start date and an "unavailable until" date. A
  vehicle currently inside that window shows an **"In service until [date]"** badge on the Fleet &
  Rates tab, so admins can see at a glance which vehicles are off the road. **This is informational
  only** — it does not block or hide that vehicle on the public booking form, since this project's
  booking flow is request-based (every request is manually reviewed and confirmed by an admin, not
  auto-approved against live availability), so the actual availability check happens when you
  confirm the booking, same as it always has.
- **Service-due reminders:** when a vehicle's `next_service_date` is within 7 days, the same
  reminder cron described above emails your admin inbox once.
- **Documents:** uploaded documents are stored in a private Supabase Storage bucket (created by
  `supabase/schema.sql`) — never public — and served back to the admin panel via short-lived
  (1-hour) signed links generated fresh each time you view them.
- **Setup:** uses the same `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` as the booking calendar —
  no separate credentials needed.

## Booking requests & email

Clicking **Check availability** (once a pick-up date, and a drop-off date for rentals, are filled
in) opens a "Request this booking" form asking for the customer's name, email and phone. Submitting
it stores the request in Supabase (see above, for the admin calendar) and sends **two emails** via
a small serverless function (`api/book.ts`, deployed automatically by Vercel — no extra config
needed): one to your business inbox with the full trip + contact details, and a confirmation to the
customer. This is a **booking request**, not a payment: no card details are collected anywhere on
the site, and no real-time inventory system is checked — you still confirm each booking yourself.

### Set this up (one-time)

1. **Create a [Resend](https://resend.com) account** (free tier: 3,000 emails/month) and grab an
   API key from **API Keys** in their dashboard.
2. **Add it to Vercel:** in your Vercel project → **Settings → Environment Variables**, add
   `RESEND_API_KEY` with that key, for the Production (and Preview, if you want) environment.
   `.env.example` in this repo lists every variable this needs, with notes.
3. **Verify your domain in Resend** (Resend → **Domains** → **Add Domain** → `quantumcarhire.com`).
   This gives you a handful of DNS records (DKIM, and usually a `send` subdomain) to add — at the
   same registrar (OnlyDomains) where you just added the Vercel A/CNAME records. **One thing to
   watch for:** if your registrar already has an SPF TXT record (likely, since you have a mailbox
   there) — e.g. `v=spf1 include:someprovider.com ~all` — do **not** add a second SPF TXT record
   for Resend. Having two breaks SPF entirely. Instead, edit your existing SPF record and merge in
   Resend's `include:` mechanism, e.g. `v=spf1 include:someprovider.com include:resend.com ~all`.
4. **Once verified**, set `BOOKING_FROM_EMAIL` in Vercel to something like
   `Quantum Car Hire <bookings@quantumcarhire.com>` (any address on your verified domain — it
   doesn't need to be a real mailbox). Until you do this, the site falls back to Resend's shared
   `onboarding@resend.dev` sender, which **can only deliver to the email address on your own Resend
   account** — fine for testing, but customers won't actually receive their confirmation email
   until the domain is verified and `BOOKING_FROM_EMAIL` is set.
5. Optionally set `BOOKING_NOTIFY_EMAIL` if booking-request notifications should go somewhere other
   than `info@quantumcarhire.com`.

### Testing it

`npm run dev` (plain Vite) does **not** run the `/api` function — only Vercel does that. To test
the full flow locally, install the Vercel CLI, run `vercel login` once, then `vercel dev` in this
folder; otherwise just test on a deployed Preview or Production URL, which runs it automatically.
If the request fails for any reason (not set up yet, Resend error, offline), the form shows an
error and points the customer to WhatsApp instead, so a booking never just silently disappears.

There's also a hidden honeypot field in the form (real visitors never see or fill it) that quietly
drops obvious bot submissions without sending you spam email.

## "Book this car" pre-fills the booking form

Clicking any "Book →" / "Book this car" link — on a Fleet card, in the expanded Rates row, or
inside the vehicle profile popup — jumps to the booking form (`#book`), switches its service type
to Car Rentals (vehicle choice only applies there), and sets the Vehicle dropdown to that specific
car, instead of leaving it on "Any". This is wired through `SitePage.tsx`'s `handleBookVehicle`,
which passes a `requestedVehicle` value down into `Hero.tsx` — the component that actually owns the
booking form's state — since Fleet/Rates/the vehicle modal are siblings of `Hero`, not its
children. `Hero` picks up a new `requestedVehicle` and applies it during render (not inside a
`useEffect`) to avoid an unnecessary extra render on every click.

## Pickup & drop-off

- **Map ↔ form sync:** tapping a pin (or any other spot) on the map updates whichever field is
  active — Pick-up or Drop-off, chosen with the "Set pickup"/"Set drop-off" buttons — and picking
  a place from the Pick-up/Drop-off dropdowns updates the map's status text and its "Open in
  Google Maps" link the same way, in both directions.
- **Place list & search:** the Pick-up/Drop-off fields (`LocationCombobox`, list sourced from
  `src/data/places.ts`) are a searchable combobox, not a plain dropdown — click to browse the full
  grouped list (Common pickup points, the four pins also shown on the map; Hotels & resorts;
  Guesthouses & villas; Landmarks & beaches), or type to filter it live. Typing anything that
  isn't in the list is accepted too — whatever you type becomes the pick-up/drop-off value
  directly, shown right in the field itself, once you press Enter or click away. Only the four
  "common" points have map coordinates; anything else opens a Google Maps text search for that
  place instead of an exact pin. Add more entries by editing the arrays in `places.ts` (add a
  `{ name, lat, lng }` to `src/data/locations.ts` too if you want a place to also get its own map
  pin).
- **Date & time:** Pick-up date/time show for all three service types (Car Rentals, Transfers,
  Tours); Drop-off date is rental-only (a transfer or tour is a one-way trip), but Drop-off time
  shows for all three, in case you want an estimated drop-off/return time either way.
- **Tapping a spot that isn't a named pin:** the field immediately shows a plain-language stand-in
  ("Near Beau Vallon", or "Pinned spot (~2.1 km from Beau Vallon)") — never raw coordinates — then
  automatically upgrades to a real street/area name (e.g. "Anse Royale road, Anse Royale") once a
  free reverse-geocoding lookup ([OpenStreetMap Nominatim](https://nominatim.org/), no API key)
  resolves, shown directly in the Pick-up/Drop-off field itself. If the lookup fails (offline,
  rate-limited, etc.) the stand-in just stays as shown — it's designed to always read as a real
  place, never lat/lng. This is a client-side demo integration: Nominatim's usage policy caps free
  use at roughly one request/second, so for a busier production site consider self-hosting
  Nominatim or switching to a paid geocoder (see `reverseGeocode` in
  `src/components/MaheMap.tsx`). A late-arriving lookup is also cancelled the moment you tap a
  named pin instead, so it can never overwrite a fresher pick with a stale custom address — a real
  race-condition bug that was caught and fixed during development.

## Notes on the conversion

- The interactive Mahé map uses [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles (no API key needed), wrapped in a typed `MaheMap` component. The map auto-fits to show every named stop (`fitBounds`, with padding) rather than a fixed center/zoom, and its zoom control sits bottom-right specifically so it can never be drawn on top of a pin (a real bug in an earlier version — a pin near the top-left corner was unclickable because the zoom buttons covered it; also fixed: named-pin clicks now stop the click from "falling through" to the map's own click handler underneath, which was overwriting the pick with a custom point).
- The vehicle "Book" modal and the footer's "Data protection" modal are controlled from `SitePage.tsx`.
- The five images that were embedded as base64 data URIs in the original HTML have been extracted into real image files under `src/assets/` and are imported normally so Vite can optimize/hash them (until replaced through the admin panel, at which point they become data URLs, same as the original prototype).
- The booking form's "Check availability" button now opens a real booking-request flow (see "Booking requests & email" above) instead of the original's demo `alert()`.
- The contact section's mailto form has been replaced with a WhatsApp-first call-to-action card (`ContactSection.tsx` / `.contact-cta` in `index.css`), since a real-time chat app is a faster and more reliable way for a car-hire business to actually receive a message than a `mailto:` form submission.
- The favicon (`public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`) is cropped tightly to just the "Q" + its gold flourish from `src/assets/logo.jpeg`, with a transparent background (flattened onto white for `apple-touch-icon.png`, per convention) — the full wordmark logo is too wide/detailed to read at browser-tab size, and the crop is deliberately kept just below the car-swoosh line and just left of the "U" so neither bleeds in as a stray mark. Regenerate it from a different crop if the brand mark changes.
- The whole site (public pages and the admin panel) got a mobile-responsiveness pass: a `booking-grid` breakpoint below 480px so date/time fields never clip, the vehicle-modal feature list stacks label-over-description on narrow screens instead of squeezing into a ~90px column, the FAQ tabs shrink slightly below 380px so all three fit without relying on hidden horizontal scroll, and every form input (site + admin) is at least 16px so iOS Safari doesn't auto-zoom the page when a field is focused.
- **SEO / link previews** (`index.html`): a `<meta name="description">` summarizing the three services (car rentals, transfers, tours), Open Graph + Twitter Card tags so links shared on WhatsApp/Facebook/iMessage/Slack/X show a proper title, description and image instead of a bare URL, `schema.org` `AutoRental` structured data (address, phone, hours) for richer search results, and `public/robots.txt` + `public/sitemap.xml` (the admin panel is excluded from crawling via `robots.txt`). The social-preview image is `public/og-image.jpg` (1200×630, generated from the logo) — regenerate it if the brand mark changes. All of these hardcode `https://www.quantumcarhire.com/` as the canonical URL; update that across `index.html`, `robots.txt` and `sitemap.xml` if the domain ever changes.
