-- Item prices + payments log for expense tracking

alter table tp_items add column if not exists price numeric(12, 2);

create table if not exists tp_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references tp_trips(id) on delete cascade,
  person_id uuid not null references tp_people(id) on delete cascade,
  amount numeric(12, 2) not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists tp_payments_trip_id_idx on tp_payments(trip_id);

alter table tp_payments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tp_payments'
  ) then
    alter publication supabase_realtime add table tp_payments;
  end if;
end $$;

alter table tp_payments enable row level security;

create policy "tp anon select payments" on tp_payments for select to anon using (true);
create policy "tp anon insert payments" on tp_payments for insert to anon with check (true);
create policy "tp anon update payments" on tp_payments for update to anon using (true) with check (true);
create policy "tp anon delete payments" on tp_payments for delete to anon using (true);
