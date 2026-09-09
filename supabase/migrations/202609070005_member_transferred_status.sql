begin;

alter table public.profiles drop constraint if exists profiles_member_status_check;
alter table public.profiles add constraint profiles_member_status_check
  check (member_status in ('active', 'inactive', 'alumni', 'transferred'));

commit;
