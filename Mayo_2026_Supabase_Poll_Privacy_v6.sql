-- Mayo 2026 Program Companion v6
-- Quick Poll privacy + manual/scheduled close support
-- Run once in Supabase SQL Editor BEFORE deploying the v6 frontend.

begin;

alter table public.polls
  add column if not exists results_published boolean not null default false,
  add column if not exists closes_at timestamptz,
  add column if not exists closed_at timestamptz;

-- Preserve visibility of results for any polls that were already closed before v6.
update public.polls
set results_published = true,
    closed_at = coalesce(closed_at, now())
where is_open = false and results_published = false;

-- Participants should only be able to read their own vote rows.
-- Admins retain access to every vote for live interim monitoring.
drop policy if exists "poll votes readable by signed-in users" on public.poll_votes;
drop policy if exists "users read own poll votes or admins read all" on public.poll_votes;
create policy "users read own poll votes or admins read all"
on public.poll_votes for select to authenticated
using (profile_id = auth.uid() or public.is_admin());

-- Voting remains allowed only while the poll is open and before an optional scheduled close.
drop policy if exists "users cast own vote in open poll" on public.poll_votes;
create policy "users cast own vote in open poll"
on public.poll_votes for insert to authenticated
with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.polls p
    where p.id = poll_votes.poll_id
      and p.is_open = true
      and (p.closes_at is null or p.closes_at > now())
  )
);

drop policy if exists "users change own vote in open poll" on public.poll_votes;
create policy "users change own vote in open poll"
on public.poll_votes for update to authenticated
using (profile_id = auth.uid())
with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.polls p
    where p.id = poll_votes.poll_id
      and p.is_open = true
      and (p.closes_at is null or p.closes_at > now())
  )
);

-- Return aggregate results without exposing individual voters.
-- Admins may call this at any time for live results.
-- Participants receive results only after manual publication or after the scheduled close time.
create or replace function public.get_poll_results(target_poll uuid)
returns table(option_id uuid, votes bigint)
language sql
security definer
set search_path = ''
as $$
  select po.id as option_id, count(pv.profile_id)::bigint as votes
  from public.poll_options po
  left join public.poll_votes pv
    on pv.poll_id = po.poll_id
   and pv.option_id = po.id
  where po.poll_id = target_poll
    and exists (
      select 1
      from public.polls p
      where p.id = target_poll
        and (
          public.is_admin()
          or p.results_published = true
          or (p.closes_at is not null and p.closes_at <= now())
        )
    )
  group by po.id;
$$;

revoke all on function public.get_poll_results(uuid) from public;
grant execute on function public.get_poll_results(uuid) to authenticated;

commit;
