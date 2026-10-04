-- Mayo 2026 User Management PATCH v7.3
-- Required before enabling permanent user deletion from the Admin Console.
-- Preserves announcement history when an administrator account is deleted.

begin;

alter table public.announcements
  alter column created_by drop not null;

alter table public.announcements
  drop constraint if exists announcements_created_by_fkey;

alter table public.announcements
  add constraint announcements_created_by_fkey
  foreign key (created_by)
  references public.profiles(id)
  on delete set null;

commit;

select
  c.is_nullable,
  rc.delete_rule
from information_schema.columns c
left join information_schema.key_column_usage kcu
  on kcu.table_schema=c.table_schema
 and kcu.table_name=c.table_name
 and kcu.column_name=c.column_name
left join information_schema.referential_constraints rc
  on rc.constraint_schema=kcu.constraint_schema
 and rc.constraint_name=kcu.constraint_name
where c.table_schema='public'
  and c.table_name='announcements'
  and c.column_name='created_by';
