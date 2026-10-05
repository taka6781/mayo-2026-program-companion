-- Mayo 2026 Admin Delete PATCH v7.13
-- Adds secure, admin-only permanent deletion for Missions, Announcements, and Polls.

begin;

-- Mission deletion also removes mission-earned points before the mission record
-- cascades its completion records. This prevents orphaned score entries.
create or replace function public.admin_delete_mission(target_mission uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists(select 1 from public.missions where id=target_mission) then
    return false;
  end if;

  delete from public.points_ledger
  where ledger_type='mission'
    and source_id=target_mission;

  delete from public.missions
  where id=target_mission;

  return true;
end;
$$;

revoke execute on function public.admin_delete_mission(uuid) from public, anon;
grant execute on function public.admin_delete_mission(uuid) to authenticated;

-- Announcement read receipts are removed automatically by ON DELETE CASCADE.
create or replace function public.admin_delete_announcement(target_announcement uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists(select 1 from public.announcements where id=target_announcement) then
    return false;
  end if;

  delete from public.announcements
  where id=target_announcement;

  return true;
end;
$$;

revoke execute on function public.admin_delete_announcement(uuid) from public, anon;
grant execute on function public.admin_delete_announcement(uuid) to authenticated;

-- Poll options and votes are removed automatically by ON DELETE CASCADE.
create or replace function public.admin_delete_poll(target_poll uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists(select 1 from public.polls where id=target_poll) then
    return false;
  end if;

  delete from public.polls
  where id=target_poll;

  return true;
end;
$$;

revoke execute on function public.admin_delete_poll(uuid) from public, anon;
grant execute on function public.admin_delete_poll(uuid) to authenticated;

commit;

select
  exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='admin_delete_mission') as mission_delete_ready,
  exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='admin_delete_announcement') as announcement_delete_ready,
  exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='admin_delete_poll') as poll_delete_ready;
