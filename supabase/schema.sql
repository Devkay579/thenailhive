-- THENAILHIVE database schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where practical.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Services & pricing
-- ---------------------------------------------------------------------------

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  length_label text not null,
  price_ngn int not null check (price_ngn >= 0),
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_ngn int not null check (price_ngn >= 0),
  suffix text,
  category text not null default 'nail-art',
  active boolean not null default true,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Gallery
-- ---------------------------------------------------------------------------

create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null default '',
  image_url text,
  service_slug text references services(slug) on delete set null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients & bookings
-- ---------------------------------------------------------------------------

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  whatsapp text,
  email text,
  instagram text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  service_price_id uuid references service_prices(id) on delete restrict,
  addon_ids uuid[] not null default '{}',
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  subtotal_ngn int not null check (subtotal_ngn >= 0),
  deposit_ngn int not null check (deposit_ngn >= 0),
  balance_ngn int not null check (balance_ngn >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'deposit_paid', 'confirmed', 'completed', 'cancelled', 'no_show')),
  inspiration_image_urls text[] not null default '{}',
  policy_accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on bookings (booking_date);
create index if not exists bookings_client_idx on bookings (client_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Availability
-- ---------------------------------------------------------------------------

create table if not exists business_hours (
  weekday smallint primary key check (weekday between 0 and 6), -- 0 = Sunday
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists blocked_slots_date_idx on blocked_slots (date);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  image_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------

create table if not exists settings (
  id smallint primary key default 1 check (id = 1),
  deposit_percent int not null default 20,
  late_fee_ngn int not null default 3000,
  policy_text text not null default '',
  whatsapp_number text not null default '',
  phone_display text not null default '',
  instagram_handle text not null default '',
  tiktok_handle text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Public (anon) role gets read-only access to content tables (services,
-- prices, addons, gallery, business hours, approved reviews, settings).
-- Everything else (clients, bookings, blocked_slots, unapproved reviews,
-- and all writes) has NO anon policy, so it is deny-by-default. All
-- reads/writes for those go through server-side code using the service
-- role key, which bypasses RLS.
-- ---------------------------------------------------------------------------

alter table services enable row level security;
alter table service_prices enable row level security;
alter table addons enable row level security;
alter table gallery_items enable row level security;
alter table clients enable row level security;
alter table bookings enable row level security;
alter table business_hours enable row level security;
alter table blocked_slots enable row level security;
alter table reviews enable row level security;
alter table settings enable row level security;

drop policy if exists "public read active services" on services;
create policy "public read active services" on services
  for select using (active = true);

drop policy if exists "public read active service_prices" on service_prices;
create policy "public read active service_prices" on service_prices
  for select using (active = true);

drop policy if exists "public read active addons" on addons;
create policy "public read active addons" on addons
  for select using (active = true);

drop policy if exists "public read active gallery_items" on gallery_items;
create policy "public read active gallery_items" on gallery_items
  for select using (active = true);

drop policy if exists "public read business_hours" on business_hours;
create policy "public read business_hours" on business_hours
  for select using (true);

drop policy if exists "public read approved reviews" on reviews;
create policy "public read approved reviews" on reviews
  for select using (approved = true);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings
  for select using (true);

-- ---------------------------------------------------------------------------
-- Booking engine (Phase 3)
--
-- Adds appointment duration per price tier, and a hard DB-level guarantee
-- that no two non-cancelled bookings can occupy overlapping time ranges
-- (single-technician assumption). This is enforced by Postgres itself via
-- an exclusion constraint, so it holds even under concurrent requests --
-- no need for application-level locking.
-- ---------------------------------------------------------------------------

create extension if not exists "btree_gist";

alter table service_prices add column if not exists duration_minutes int not null default 60;

alter table bookings add column if not exists time_range tsrange
  generated always as (tsrange(booking_date + start_time, booking_date + end_time)) stored;

alter table bookings drop constraint if exists bookings_no_overlap;
alter table bookings add constraint bookings_no_overlap
  exclude using gist (time_range with &&)
  where (status not in ('cancelled', 'no_show'));

-- Inspiration photo uploads. Private bucket -- customers upload directly
-- from the browser (anon insert only, no read/list), admin reads via the
-- service-role key which bypasses RLS entirely.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspiration-photos',
  'inspiration-photos',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

drop policy if exists "anon upload inspiration photos" on storage.objects;
create policy "anon upload inspiration photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'inspiration-photos');

-- ---------------------------------------------------------------------------
-- Service photos (admin-uploaded, shown on the public Services page). Reuses
-- the existing public "gallery-photos" bucket -- no new bucket/policy needed.
-- ---------------------------------------------------------------------------

alter table services add column if not exists image_url text;

-- ---------------------------------------------------------------------------
-- Booking reference (short id shown to customers/admin, e.g. on confirmation
-- emails: "Booking ref: 64561d25"). Stored as a real text column so it can
-- be searched with a normal ilike filter -- PostgREST can't ilike a uuid
-- column directly even with a cast in the filter key.
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists booking_ref text
  generated always as (substr(id::text, 1, 8)) stored;

create index if not exists bookings_booking_ref_idx on bookings (booking_ref);

-- ---------------------------------------------------------------------------
-- Contact messages (public Contact page form, for people who'd rather not
-- reach out on WhatsApp). Stored so a submission survives even if the
-- notification email fails to send -- inserted via the service-role client
-- from a server action, so no anon insert policy is needed.
-- ---------------------------------------------------------------------------

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create index if not exists contact_messages_created_at_idx on contact_messages (created_at desc);

-- Unread tracking for the admin Messages inbox. Null read_at = unread; the
-- partial index keeps the sidebar's unread-count query cheap.
alter table contact_messages add column if not exists read_at timestamptz;

create index if not exists contact_messages_unread_idx on contact_messages (created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- Removal + new set in one appointment. A removal booking can name the
-- service done straight after it; the booking's price, deposit and time
-- slot already include both. Null for every other booking.
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists followup_service_price_id uuid
  references service_prices(id) on delete restrict;

-- ---------------------------------------------------------------------------
-- Deposit payment record. Deposits are paid off-site (bank transfer, sent
-- over WhatsApp), so the admin records when it landed, how it was paid and
-- the transfer reference. Null deposit_paid_at = not received yet.
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists deposit_paid_at timestamptz;
alter table bookings add column if not exists payment_method text
  check (payment_method in ('bank_transfer', 'cash', 'pos', 'other'));
alter table bookings add column if not exists payment_reference text;

-- ---------------------------------------------------------------------------
-- Gallery videos. A gallery item is either a photo or a short video; the
-- file's public URL lives in image_url either way. Videos are uploaded from
-- the admin's browser straight to storage (signed upload URL) since they're
-- far over the server-action body limit, so the bucket must accept them.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Bank account clients pay their deposit into. Shown on the booking
-- confirmation page and in the booking-received email; set from admin
-- Settings. Empty = not set up yet (the page then just points to WhatsApp).
-- ---------------------------------------------------------------------------

alter table settings add column if not exists bank_name text not null default '';
alter table settings add column if not exists bank_account_number text not null default '';
alter table settings add column if not exists bank_account_name text not null default '';

-- Photo for the "Nail Art" row on the home page menu. Nail art is priced via
-- add-ons rather than a service, so there's no service row to hang it on.
alter table settings add column if not exists nail_art_image_url text;

-- About page wording + photos, edited from admin (About Page). Shape lives in
-- lib/about.ts; anything missing falls back to the built-in defaults.
alter table settings add column if not exists about_content jsonb not null default '{}'::jsonb;

alter table gallery_items add column if not exists media_type text not null default 'image'
  check (media_type in ('image', 'video'));

update storage.buckets
set
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
where id = 'gallery-photos';
