-- trip-packer schema (tp_ prefix)
-- Run this in the Supabase SQL editor for your trip-packer project.

-- Tables
create table if not exists tp_trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,
  trip_date date,
  owner_person_id uuid references tp_people(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists tp_trips_owner_person_id_idx on tp_trips(owner_person_id);

create table if not exists tp_people (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references tp_trips(id) on delete cascade,
  name text not null,
  active_session_id text,
  last_active_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists tp_people_trip_id_idx on tp_people(trip_id);

create table if not exists tp_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references tp_trips(id) on delete cascade,
  name text not null,
  quantity int default 1,
  category text,
  price numeric(12, 2),
  assigned_person_id uuid references tp_people(id) on delete set null,
  added_by_person_id uuid references tp_people(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists tp_items_trip_id_idx on tp_items(trip_id);
create index if not exists tp_items_assigned_person_id_idx on tp_items(assigned_person_id);
create index if not exists tp_items_added_by_person_id_idx on tp_items(added_by_person_id);

create table if not exists tp_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references tp_trips(id) on delete cascade,
  person_id uuid not null references tp_people(id) on delete cascade,
  amount numeric(12, 2) not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists tp_payments_trip_id_idx on tp_payments(trip_id);

-- Required for Realtime filters on these tables
alter table tp_items replica identity full;
alter table tp_people replica identity full;
alter table tp_payments replica identity full;

-- Realtime: broadcast changes to connected clients
alter publication supabase_realtime add table tp_items;
alter publication supabase_realtime add table tp_people;
alter publication supabase_realtime add table tp_payments;

-- Row Level Security
-- SECURITY TRADE-OFF: There is no user authentication. Access control relies on
-- the unguessable trip UUID and PIN in the join link. Anyone who knows both can
-- read and modify trip data. This is intentional for a lightweight coordination app.
-- m3alm_al_aksa and similar apps may use Prisma with direct Postgres; trip-packer uses
-- the Supabase anon key with permissive RLS for browser clients.
alter table tp_trips enable row level security;
alter table tp_people enable row level security;
alter table tp_items enable row level security;
alter table tp_payments enable row level security;

-- Permissive policies for anonymous (anon key) access
create policy "tp anon select trips" on tp_trips for select to anon using (true);
create policy "tp anon insert trips" on tp_trips for insert to anon with check (true);
create policy "tp anon update trips" on tp_trips for update to anon using (true) with check (true);
create policy "tp anon delete trips" on tp_trips for delete to anon using (true);

create policy "tp anon select people" on tp_people for select to anon using (true);
create policy "tp anon insert people" on tp_people for insert to anon with check (true);
create policy "tp anon update people" on tp_people for update to anon using (true) with check (true);
create policy "tp anon delete people" on tp_people for delete to anon using (true);

create policy "tp anon select items" on tp_items for select to anon using (true);
create policy "tp anon insert items" on tp_items for insert to anon with check (true);
create policy "tp anon update items" on tp_items for update to anon using (true) with check (true);
create policy "tp anon delete items" on tp_items for delete to anon using (true);

create policy "tp anon select payments" on tp_payments for select to anon using (true);
create policy "tp anon insert payments" on tp_payments for insert to anon with check (true);
create policy "tp anon update payments" on tp_payments for update to anon using (true) with check (true);
create policy "tp anon delete payments" on tp_payments for delete to anon using (true);
