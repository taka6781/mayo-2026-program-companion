-- Mayo 2026 Schedule Display/Data Patch v6.4
-- Adds explicit event time zones and normalizes map/description data.
-- Non-destructive to schedule events themselves: no rows are deleted.

begin;

alter table public.schedule_events
  add column if not exists time_zone text;

-- Rochester / Mayo Clinic Platform Welcome Week: event-local Central Time.
update public.schedule_events
set time_zone = 'America/Chicago'
where starts_at >= '2026-10-25T00:00:00-05:00'::timestamptz
  and starts_at <  '2026-10-29T00:00:00-05:00'::timestamptz;

-- Phoenix / Arizona program: Arizona local time (MST year-round).
update public.schedule_events
set time_zone = 'America/Phoenix'
where starts_at >= '2026-10-29T00:00:00-07:00'::timestamptz
  and starts_at <  '2026-10-31T00:00:00-07:00'::timestamptz;

-- Give every event with a known location a usable map URL.
-- Existing hand-entered/exact map URLs are preserved.
update public.schedule_events
set location_url =
  'https://www.google.com/maps/search/?api=1&query=' ||
  replace(replace(location, ' ', '+'), '#', '%23')
where coalesce(trim(location),'') <> ''
  and coalesce(trim(location_url),'') = '';

-- Normalize common description labels onto separate lines.
update public.schedule_events
set description = trim(
  replace(
    replace(
      replace(coalesce(description,''), ' Speaker(s) / Host:', E'\nSpeaker / Host:'),
      ' Speaker / Host:', E'\nSpeaker / Host:'
    ),
    ' Address:', E'\nAddress:'
  )
)
where coalesce(description,'') <> '';

commit;
