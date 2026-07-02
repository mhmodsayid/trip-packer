-- Admin participant flag on tp_people (hidden from member listings)
alter table tp_people add column if not exists is_admin boolean not null default false;
