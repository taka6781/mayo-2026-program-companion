-- Mayo 2026 Program Admin Console PATCH v7.0
-- Adds Mission visibility control and enables realtime updates for Teams/Team Membership/Profile changes.
-- Existing admin RLS policies for teams, team_members, schedule_events and missions remain in force.

begin;

-- Mission visibility switch used by the Admin console.
alter table public.missions
  add column if not exists is_active boolean not null default true;

-- Participants only read active missions; admins can read active + inactive.
drop policy if exists "missions readable by signed-in users" on public.missions;

create policy "missions readable by signed-in users"
on public.missions for select to authenticated
using (is_active or public.is_admin());

-- Recreate secure mission-completion RPC so inactive missions cannot be completed.
create or replace function public.complete_mission(target_mission uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  m public.missions%rowtype;
  new_status text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into m
  from public.missions
  where id = target_mission;

  if m.id is null then
    raise exception 'Mission not found';
  end if;
  if not m.is_active then
    raise exception 'Mission is inactive';
  end if;
  if m.active_from is not null and now() < m.active_from then
    raise exception 'Mission is not active yet';
  end if;
  if m.active_until is not null and now() > m.active_until then
    raise exception 'Mission has ended';
  end if;

  new_status := case when m.requires_admin_approval then 'pending' else 'approved' end;

  insert into public.mission_completions(mission_id, profile_id, status)
  values (target_mission, me, new_status)
  on conflict (mission_id, profile_id) do nothing;

  if new_status = 'approved' then
    insert into public.points_ledger(
      profile_id, amount, ledger_type, source_id, description, created_by
    )
    values (
      me, m.points, 'mission', m.id, 'Mission: ' || m.title, me
    )
    on conflict do nothing;
  end if;

  return new_status;
end;
$$;

revoke execute on function public.complete_mission(uuid) from public, anon;
grant execute on function public.complete_mission(uuid) to authenticated;

-- Make team/profile admin edits refresh other signed-in app sessions quickly.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

commit;

select
  (select count(*) from information_schema.columns
   where table_schema='public' and table_name='missions' and column_name='is_active') as mission_active_column,
  (select count(*) from pg_publication_tables
   where pubname='supabase_realtime' and schemaname='public' and tablename in ('teams','team_members','profiles')) as admin_realtime_tables;
