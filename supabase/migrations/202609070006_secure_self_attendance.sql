begin;

alter table public.events
  add column attendance_token uuid unique,
  add column attendance_code_hash text,
  add column attendance_open_at timestamptz,
  add column attendance_close_at timestamptz,
  add column attendance_latitude numeric(9,6),
  add column attendance_longitude numeric(9,6),
  add column attendance_radius_m integer not null default 150 check (attendance_radius_m between 25 and 1000),
  add column late_after_minutes integer not null default 15 check (late_after_minutes between 0 and 180),
  add column min_presence_minutes integer not null default 30 check (min_presence_minutes between 0 and 600),
  add column attendance_locked boolean not null default false,
  add constraint attendance_window_valid check (attendance_close_at is null or attendance_open_at < attendance_close_at);

alter table public.attendance_records
  add column source text not null default 'manual' check (source in ('manual', 'self')),
  add column verification_status text not null default 'verified' check (verification_status in ('pending', 'verified', 'rejected')),
  add column check_in_at timestamptz,
  add column check_out_at timestamptz,
  add column check_in_latitude numeric(9,6),
  add column check_in_longitude numeric(9,6),
  add column location_accuracy_m numeric(8,2),
  add column distance_m numeric(9,2),
  add column verification_note text;

create or replace function public.set_attendance_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare selected_points numeric(8,2);
begin
  if new.verification_status <> 'verified' then
    new.points_awarded = 0;
  else
    select case new.status
      when 'present' then present_points
      when 'late' then late_points
      when 'partial' then partial_points
      when 'permission' then permission_points
      else absent_points
    end into selected_points from events where id = new.event_id;
    if selected_points is null then raise exception 'Kegiatan tidak ditemukan'; end if;
    new.points_awarded = selected_points;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendance_set_points on public.attendance_records;
create trigger attendance_set_points
  before insert or update of event_id, status, verification_status on public.attendance_records
  for each row execute function public.set_attendance_points();

commit;
