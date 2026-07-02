-- trip-packer schema
-- Run this in the Supabase SQL editor for a new project.

-- Tables
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,
  created_at timestamptz default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create index if not exists people_trip_id_idx on people(trip_id);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  quantity int default 1,
  category text,
  assigned_person_id uuid references people(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists items_trip_id_idx on items(trip_id);
create index if not exists items_assigned_person_id_idx on items(assigned_person_id);

-- Required for Realtime filters on these tables
alter table items replica identity full;
alter table people replica identity full;

-- Realtime: broadcast changes to connected clients
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table people;

-- Row Level Security
-- SECURITY TRADE-OFF: There is no user authentication. Access control relies on
-- the unguessable trip UUID and PIN in the join link. Anyone who knows both can
-- read and modify trip data. This is intentional for a lightweight coordination app.
alter table trips enable row level security;
alter table people enable row level security;
alter table items enable row level security;

-- Permissive policies for anonymous (anon key) access
create policy "anon select trips" on trips for select to anon using (true);
create policy "anon insert trips" on trips for insert to anon with check (true);
create policy "anon update trips" on trips for update to anon using (true) with check (true);
create policy "anon delete trips" on trips for delete to anon using (true);

create policy "anon select people" on people for select to anon using (true);
create policy "anon insert people" on people for insert to anon with check (true);
create policy "anon update people" on people for update to anon using (true) with check (true);
create policy "anon delete people" on people for delete to anon using (true);

create policy "anon select items" on items for select to anon using (true);
create policy "anon insert items" on items for insert to anon with check (true);
create policy "anon update items" on items for update to anon using (true) with check (true);
create policy "anon delete items" on items for delete to anon using (true);
