-- Mayo 2026 Kudos rule v6.6
-- Enforces: one Kudo from the same giver to the same recipient per program day.
-- Points are derived in the app from kudos records:
--   giver +5 points, recipient +3 points.
--
-- "Program day" uses America/Chicago for the Rochester portion and
-- America/Phoenix from Oct 29 onward.

begin;

-- Prevent self-Kudos at database level.
alter table public.kudos
  drop constraint if exists kudos_no_self;

alter table public.kudos
  add constraint kudos_no_self
  check (from_profile_id <> to_profile_id);

-- Remove an older v6.6 index if this patch is re-run.
drop index if exists public.kudos_one_per_recipient_per_program_day;

-- One giver -> one recipient -> one program day.
-- The CASE keeps the calendar day aligned with the two program locations.
create unique index kudos_one_per_recipient_per_program_day
on public.kudos (
  from_profile_id,
  to_profile_id,
  (
    case
      when created_at < '2026-10-29T07:00:00Z'::timestamptz
        then (created_at at time zone 'America/Chicago')::date
      else (created_at at time zone 'America/Phoenix')::date
    end
  )
);

commit;
