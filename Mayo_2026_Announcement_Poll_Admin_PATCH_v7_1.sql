-- Mayo 2026 Announcement & Poll Management PATCH v7.1
-- Adds archive/restore controls without deleting historical records.

begin;

alter table public.announcements
  add column if not exists is_active boolean not null default true;

alter table public.polls
  add column if not exists is_active boolean not null default true;

commit;

select
  (select count(*) from information_schema.columns
   where table_schema='public' and table_name='announcements' and column_name='is_active') as announcement_active_column,
  (select count(*) from information_schema.columns
   where table_schema='public' and table_name='polls' and column_name='is_active') as poll_active_column;
