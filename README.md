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
- **Tapping a spot that isn't a named pin:** the field shows the raw coordinates for a moment
  ("Pinned location (-4.681, 55.419)"), then automatically swaps in a real street/area name (e.g.
  "Anse Royale road, Anse Royale") once a free reverse-geocoding lookup
  ([OpenStreetMap Nominatim](https://nominatim.org/), no API key) resolves — so visitors never have
  to read raw lat/lng. If the lookup fails (offline, rate-limited, etc.) the coordinates just stay
  as shown. This is a client-side demo integration: Nominatim's usage policy caps free use at
  roughly one request/second, so for a busier production site consider self-hosting Nominatim or
  switching to a paid geocoder (see `reverseGeocode` in `src/components/MaheMap.tsx`).

## Notes on the conversion

- The interactive Mahé map uses [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles (no API key needed), wrapped in a typed `MaheMap` component. The map auto-fits to show every named stop (`fitBounds`, with padding) rather than a fixed center/zoom, and its zoom control sits bottom-right specifically so it can never be drawn on top of a pin (a real bug in an earlier version — a pin near the top-left corner was unclickable because the zoom buttons covered it; also fixed: named-pin clicks now stop the click from "falling through" to the map's own click handler underneath, which was overwriting the pick with a custom point).
- The vehicle "Book" modal and the footer's "Data protection" modal are controlled from `SitePage.tsx`.
- The five images that were embedded as base64 data URIs in the original HTML have been extracted into real image files under `src/assets/` and are imported normally so Vite can optimize/hash them (until replaced through the admin panel, at which point they become data URLs, same as the original prototype).
- The booking form's "Check availability" button still just shows a demo `alert()`, exactly like the original — wire it up to a real reservation system when ready.
- The contact section's mailto form has been replaced with a WhatsApp-first call-to-action card (`ContactSection.tsx` / `.contact-cta` in `index.css`), since a real-time chat app is a faster and more reliable way for a car-hire business to actually receive a message than a `mailto:` form submission.
- The favicon (`public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`) is cropped from the "Q" + swoosh mark in `src/assets/logo.jpeg` — the full wordmark logo is too wide/detailed to read at browser-tab size, so only that portion was used. Regenerate it from a different crop if the brand mark changes.
- The whole site (public pages and the admin panel) got a mobile-responsiveness pass: a `booking-grid` breakpoint below 480px so date/time fields never clip, the vehicle-modal feature list stacks label-over-description on narrow screens instead of squeezing into a ~90px column, the FAQ tabs shrink slightly below 380px so all three fit without relying on hidden horizontal scroll, and every form input (site + admin) is at least 16px so iOS Safari doesn't auto-zoom the page when a field is focused.
