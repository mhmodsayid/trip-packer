-- Trip owner: creator becomes trip-level admin
alter table tp_trips
  add column if not exists owner_person_id uuid references tp_people(id) on delete set null;

create index if not exists tp_trips_owner_person_id_idx on tp_trips(owner_person_id);
