-- Name occupancy / session tracking on tp_people
alter table tp_people add column if not exists active_session_id text;
alter table tp_people add column if not exists last_active_at timestamptz;
