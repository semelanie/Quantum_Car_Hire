-- Quantum Car Hire — database schema
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query
-- → paste this whole file → Run. Safe to re-run any time you pull a newer
-- version of this file (every statement is idempotent — IF NOT EXISTS /
-- ADD COLUMN IF NOT EXISTS — so re-running it after an update only adds
-- what's missing).
--
-- This backs four admin-panel features, all server-only (the browser never
-- talks to Supabase directly — everything goes through /api/* using the
-- service role key, which is why Row Level Security below has zero public
-- policies: that's intentional, not an oversight):
--   • Bookings        — api/book.ts (insert), api/admin-bookings.ts (list/update)
--   • Drivers         — api/admin-drivers.ts (manage), api/driver-login.ts +
--                       api/driver-bookings.ts (the driver's own view)
--   • Vehicle service — api/admin-service-events.ts
--   • Notifications   — api/notify-cron.ts (reads across all of the above)

create extension if not exists "pgcrypto";

-- ============================================================= drivers ===
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active boolean not null default true,

  name text not null,
  email text not null unique,
  phone text,

  -- PBKDF2-SHA256, stored as "iterations:saltHex:hashHex" — see api/_auth.ts.
  -- Never plaintext, never a fast unsalted hash.
  password_hash text not null
);

-- ============================================================ bookings ===
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),

  name text not null,
  email text not null,
  phone text not null,
  notes text,

  service_type text not null,
  pickup_loc text,
  dropoff_loc text,
  car_type text,
  passengers int,

  pickup_date date,
  pickup_time text,
  dropoff_date date,
  dropoff_time text,

  baby_seat boolean not null default false
);

-- Driver assignment + the driver's own trip-progress workflow. `status`
-- above stays the admin's request state (pending/confirmed/cancelled);
-- `trip_status` is a separate, finer-grained state the assigned driver
-- moves through once a booking is confirmed and assigned.
alter table bookings add column if not exists assigned_driver_id uuid references drivers(id) on delete set null;
alter table bookings add column if not exists trip_status text not null default 'pickup_pending'
  check (trip_status in ('pickup_pending', 'picked_up', 'in_transit', 'dropped_off', 'completed'));

-- Dedup flags so the reminder cron (api/notify-cron.ts) never sends the same
-- "upcoming pickup" / "pickup time" / etc. email twice.
alter table bookings add column if not exists notified_pickup_soon boolean not null default false;
alter table bookings add column if not exists notified_pickup_now boolean not null default false;
alter table bookings add column if not exists notified_dropoff_soon boolean not null default false;
alter table bookings add column if not exists notified_dropoff_now boolean not null default false;

create index if not exists bookings_pickup_date_idx on bookings (pickup_date);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_assigned_driver_idx on bookings (assigned_driver_id);

-- ===================================================== service events ===
-- Servicing, maintenance, inspections, insurance renewals, etc. Each row
-- also acts as an "unavailable" window for that vehicle — see
-- src/admin/ServiceCalendar.tsx and the "Unavailable" badge on the Fleet &
-- Rates tab. `vehicle_key`/`vehicle_label` are a snapshot of which vehicle
-- this is about (the fleet itself lives in src/data/vehicles.ts, not the
-- database, so we store enough here to display and match against it
-- without a hard foreign key).
create table if not exists service_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  vehicle_key text not null,
  vehicle_label text not null,
  registration text,

  service_type text not null,
  service_date date not null,
  service_time text,
  -- Last day the vehicle is unavailable for. Defaults to service_date
  -- itself (a same-day service) when not given a longer window.
  unavailable_until date not null,

  mileage int,
  provider text,
  cost numeric,
  next_service_date date,
  notes text,

  -- [{ "name": "invoice.pdf", "path": "<storage object path>", "size": 12345 }]
  documents jsonb not null default '[]',

  notified_upcoming boolean not null default false
);

create index if not exists service_events_service_date_idx on service_events (service_date);
create index if not exists service_events_vehicle_key_idx on service_events (vehicle_key);
create index if not exists service_events_unavailable_until_idx on service_events (unavailable_until);

-- Private bucket for service documents/invoices. Uploaded and read back
-- only via api/admin-service-events.ts using the service role key (signed,
-- short-lived URLs for viewing) — never exposed as a public bucket.
insert into storage.buckets (id, name, public)
values ('service-documents', 'service-documents', false)
on conflict (id) do nothing;

-- ================================================================ RLS ===
-- Lock every table above down completely at the database level. With RLS
-- enabled and zero policies defined, every request through Supabase's
-- public API (the anon and authenticated roles) is denied — reads and
-- writes. Only the service_role key bypasses RLS, and that key lives
-- exclusively in Vercel's server-side environment variables
-- (SUPABASE_SERVICE_ROLE_KEY), never shipped to the browser. That's what
-- every api/*.ts file in this project uses.
alter table bookings enable row level security;
alter table drivers enable row level security;
alter table service_events enable row level security;
