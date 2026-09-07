begin;

alter table public.events
  add column attendance_mode text not null default 'offline' check (attendance_mode in ('offline', 'online')),
  add column late_points numeric(8,2),
  add column partial_points numeric(8,2);

update public.events set late_points = present_points, partial_points = present_points / 2
where late_points is null or partial_points is null;

alter table public.events
  alter column late_points set not null,
  alter column partial_points set not null;

alter table public.attendance_records drop constraint attendance_records_status_check;
alter table public.attendance_records add constraint attendance_records_status_check
  check (status in ('present', 'late', 'partial', 'permission', 'absent'));

create or replace function public.set_attendance_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare selected_points numeric(8,2);
begin
  select case new.status
    when 'present' then present_points
    when 'late' then late_points
    when 'partial' then partial_points
    when 'permission' then permission_points
    else absent_points
  end into selected_points from events where id = new.event_id;
  if selected_points is null then raise exception 'Kegiatan tidak ditemukan'; end if;
  new.points_awarded = selected_points;
  new.updated_at = now();
  return new;
end;
$$;

commit;
