-- Add creator tracking for item deletion permissions
alter table tp_items
  add column if not exists added_by_person_id uuid references tp_people(id) on delete set null;

create index if not exists tp_items_added_by_person_id_idx on tp_items(added_by_person_id);
