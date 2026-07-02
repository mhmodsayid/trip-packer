-- Optional trip date on tp_trips
alter table tp_trips add column if not exists trip_date date;
