-- Mayo 2026 Self-Certified Missions + Balanced Team Assignment PATCH v7.12

begin;

-- 1) Challenge is now fully self-certified: no mission requires admin approval.
update public.missions
set requires_admin_approval = false
where requires_admin_approval is distinct from false;

-- Convert any existing pending submissions to approved and award missing points.
insert into public.points_ledger(
  profile_id, amount, ledger_type, source_id, description, created_by
)
select
  mc.profile_id,
  m.points,
  'mission',
  m.id,
  'Mission: ' || m.title,
  mc.profile_id
from public.mission_completions mc
join public.missions m on m.id = mc.mission_id
where mc.status = 'pending'
on conflict do nothing;

update public.mission_completions
set status='approved',
    approved_by=null
where status='pending';

-- Secure completion function: always approves immediately.
create or replace function public.complete_mission(target_mission uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  m public.missions%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into m
  from public.missions
  where id = target_mission;

  if m.id is null then raise exception 'Mission not found'; end if;
  if not m.is_active then raise exception 'Mission is inactive'; end if;
  if m.active_from is not null and now() < m.active_from then raise exception 'Mission is not active yet'; end if;
  if m.active_until is not null and now() > m.active_until then raise exception 'Mission has ended'; end if;

  insert into public.mission_completions(mission_id, profile_id, status)
  values (target_mission, me, 'approved')
  on conflict (mission_id, profile_id)
  do update set status='approved', approved_by=null, completed_at=now();

  insert into public.points_ledger(
    profile_id, amount, ledger_type, source_id, description, created_by
  )
  values (
    me, m.points, 'mission', m.id, 'Mission: ' || m.title, me
  )
  on conflict do nothing;

  return 'approved';
end;
$$;

revoke execute on function public.complete_mission(uuid) from public, anon;
grant execute on function public.complete_mission(uuid) to authenticated;

-- 2) Apply a previewed set of team assignments atomically.
create or replace function public.apply_team_assignments(assignments jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  profile_uuid uuid;
  team_uuid uuid;
  applied integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if jsonb_typeof(assignments) <> 'array' then
    raise exception 'Assignments must be a JSON array';
  end if;

  -- Validate every row before changing anything.
  for item in select value from jsonb_array_elements(assignments)
  loop
    profile_uuid := (item->>'profile_id')::uuid;
    team_uuid := (item->>'team_id')::uuid;

    if not exists(select 1 from public.profiles where id=profile_uuid) then
      raise exception 'Unknown profile %', profile_uuid;
    end if;
    if not exists(select 1 from public.teams where id=team_uuid) then
      raise exception 'Unknown team %', team_uuid;
    end if;
  end loop;

  -- Delete only assignments for the participants included in this confirmed draft.
  delete from public.team_members tm
  where tm.profile_id in (
    select (value->>'profile_id')::uuid
    from jsonb_array_elements(assignments)
  );

  for item in select value from jsonb_array_elements(assignments)
  loop
    profile_uuid := (item->>'profile_id')::uuid;
    team_uuid := (item->>'team_id')::uuid;

    insert into public.team_members(team_id,profile_id)
    values(team_uuid,profile_uuid);

    applied := applied + 1;
  end loop;

  return applied;
end;
$$;

revoke execute on function public.apply_team_assignments(jsonb) from public, anon;
grant execute on function public.apply_team_assignments(jsonb) to authenticated;

commit;

select
  (select count(*) from public.missions where requires_admin_approval=true) as missions_still_requiring_approval,
  (select count(*) from public.mission_completions where status='pending') as pending_completions_remaining,
  exists(
    select 1 from information_schema.routines
    where routine_schema='public' and routine_name='apply_team_assignments'
  ) as balanced_team_assignment_ready;
