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
  App.tsx         router root (/ → SitePage, /admin → AdminPage)
  main.tsx        React entry point
  index.css       global stylesheet (converted from the original <style> block)
```

## Admin panel

Go to **`/admin`** (there's also a small "Admin" link in the footer) to edit rates, vehicle
details, and photos without touching code.

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

The admin panel is a client-side route (`/admin`), handled by React Router. `npm run dev` and
`npm run preview` both serve it correctly out of the box. If you deploy the `dist/` folder to a
static host (Netlify, Vercel, GitHub Pages, etc.), you'll need to configure that host to serve
`index.html` for unknown paths (a SPA fallback / rewrite rule) so that a direct visit to
`/admin` doesn't 404 — most hosts have a one-line config for this (e.g. Netlify's `_redirects`
with `/* /index.html 200`, or Vercel's `rewrites` in `vercel.json`).

## Booking requests & email

Clicking **Check availability** (once a pick-up date, and a drop-off date for rentals, are filled
in) opens a "Request this booking" form asking for the customer's name, email and phone. Submitting
it sends **two emails** via a small serverless function (`api/book.ts`, deployed automatically by
Vercel — no extra config needed): one to your business inbox with the full trip + contact details,
and a confirmation to the customer. This is a **booking request**, not a payment: no card details
are collected anywhere on the site, and no real-time inventory system is checked — you still
confirm each booking yourself.

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

## Pickup & drop-off

- **Map ↔ form sync:** tapping a pin (or any other spot) on the map updates whichever field is
  active — Pick-up or Drop-off, chosen with the "Set pickup"/"Set drop-off" buttons — and picking
  a place from the Pick-up/Drop-off dropdowns updates the map's status text and its "Open in
  Google Maps" link the same way, in both directions.
- **Place list:** the Pick-up/Drop-off dropdowns (`src/data/places.ts`) are grouped into Common
  pickup points (the four pins also shown on the map), Hotels & resorts, Guesthouses & villas,
  and Landmarks & beaches — real, well-known Mahé places. Only the four "common" points have map
  coordinates; picking anything else opens a Google Maps text search for that place instead of an
  exact pin. Add more entries by editing the arrays in that file (add a `{ name, lat, lng }` to
  `src/data/locations.ts` too if you want a place to also get its own map pin).
- **Date & time:** Pick-up date/time show for all three service types (Car Rentals, Transfers,
  Tours); Drop-off date is rental-only (a transfer or tour is a one-way trip), but Drop-off time
  shows for all three, in case you want an estimated drop-off/return time either way.
- **Tapping a spot that isn't a named pin:** the field immediately shows a plain-language stand-in
  ("Near Beau Vallon", or "Pinned spot (~2.1 km from Beau Vallon)") — never raw coordinates — then
  automatically upgrades to a real street/area name (e.g. "Anse Royale road, Anse Royale") once a
  free reverse-geocoding lookup ([OpenStreetMap Nominatim](https://nominatim.org/), no API key)
  resolves. If the lookup fails (offline, rate-limited, etc.) the stand-in just stays as shown —
  it's designed to always read as a real place, never lat/lng. This is a client-side demo
  integration: Nominatim's usage policy caps free use at roughly one request/second, so for a
  busier production site consider self-hosting Nominatim or switching to a paid geocoder (see
  `reverseGeocode` in `src/components/MaheMap.tsx`). A late-arriving lookup is also cancelled the
  moment you tap a named pin instead, so it can never overwrite a fresher pick back to "Other
  address" — a real race-condition bug that was caught and fixed during development.

## Notes on the conversion

- The interactive Mahé map uses [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles (no API key needed), wrapped in a typed `MaheMap` component. The map auto-fits to show every named stop (`fitBounds`, with padding) rather than a fixed center/zoom, and its zoom control sits bottom-right specifically so it can never be drawn on top of a pin (a real bug in an earlier version — a pin near the top-left corner was unclickable because the zoom buttons covered it; also fixed: named-pin clicks now stop the click from "falling through" to the map's own click handler underneath, which was overwriting the pick with a custom point).
- The vehicle "Book" modal and the footer's "Data protection" modal are controlled from `SitePage.tsx`.
- The five images that were embedded as base64 data URIs in the original HTML have been extracted into real image files under `src/assets/` and are imported normally so Vite can optimize/hash them (until replaced through the admin panel, at which point they become data URLs, same as the original prototype).
- The booking form's "Check availability" button now opens a real booking-request flow (see "Booking requests & email" above) instead of the original's demo `alert()`.
- The contact section's mailto form has been replaced with a WhatsApp-first call-to-action card (`ContactSection.tsx` / `.contact-cta` in `index.css`), since a real-time chat app is a faster and more reliable way for a car-hire business to actually receive a message than a `mailto:` form submission.
- The favicon (`public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`) is cropped from the "Q" + swoosh mark in `src/assets/logo.jpeg` — the full wordmark logo is too wide/detailed to read at browser-tab size, so only that portion was used. Regenerate it from a different crop if the brand mark changes.
- The whole site (public pages and the admin panel) got a mobile-responsiveness pass: a `booking-grid` breakpoint below 480px so date/time fields never clip, the vehicle-modal feature list stacks label-over-description on narrow screens instead of squeezing into a ~90px column, the FAQ tabs shrink slightly below 380px so all three fit without relying on hidden horizontal scroll, and every form input (site + admin) is at least 16px so iOS Safari doesn't auto-zoom the page when a field is focused.
- **SEO / link previews** (`index.html`): a `<meta name="description">` summarizing the three services (car rentals, transfers, tours), Open Graph + Twitter Card tags so links shared on WhatsApp/Facebook/iMessage/Slack/X show a proper title, description and image instead of a bare URL, `schema.org` `AutoRental` structured data (address, phone, hours) for richer search results, and `public/robots.txt` + `public/sitemap.xml` (the admin panel is excluded from crawling via `robots.txt`). The social-preview image is `public/og-image.jpg` (1200×630, generated from the logo) — regenerate it if the brand mark changes. All of these hardcode `https://www.quantumcarhire.com/` as the canonical URL; update that across `index.html`, `robots.txt` and `sitemap.xml` if the domain ever changes.
