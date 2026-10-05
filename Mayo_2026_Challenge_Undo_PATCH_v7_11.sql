-- Mayo 2026 Challenge Undo PATCH v7.11
-- Allows a participant to undo/cancel their own mission completion.
-- If the mission had already awarded points, those mission points are removed.

begin;

create or replace function public.undo_mission_completion(target_mission uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  c public.mission_completions%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into c
  from public.mission_completions
  where mission_id = target_mission
    and profile_id = me;

  if c.id is null then
    return 'not_completed';
  end if;

  -- Remove any mission points previously awarded for this completion.
  delete from public.points_ledger
  where profile_id = me
    and ledger_type = 'mission'
    and source_id = target_mission;

  -- Remove the completion/submission itself so the user can complete it again.
  delete from public.mission_completions
  where id = c.id;

  return 'undone';
end;
$$;

revoke execute on function public.undo_mission_completion(uuid) from public, anon;
grant execute on function public.undo_mission_completion(uuid) to authenticated;

commit;

select
  routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name='undo_mission_completion';
