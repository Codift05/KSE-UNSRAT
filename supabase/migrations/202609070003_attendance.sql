begin;

alter table public.events
  add column present_points numeric(8,2) not null default 10,
  add column permission_points numeric(8,2) not null default 0,
  add column absent_points numeric(8,2) not null default -10;

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present', 'permission', 'absent')),
  points_awarded numeric(8,2) not null,
  permission_url text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id),
  constraint attendance_permission_proof check (status = 'permission' or permission_url is null)
);

create or replace function public.set_attendance_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare selected_points numeric(8,2);
begin
  select case new.status
    when 'present' then present_points
    when 'permission' then permission_points
    else absent_points
  end into selected_points from events where id = new.event_id;
  if selected_points is null then raise exception 'Kegiatan tidak ditemukan'; end if;
  new.points_awarded = selected_points;
  new.updated_at = now();
  return new;
end;
$$;

create trigger attendance_set_points
  before insert or update of event_id, status on public.attendance_records
  for each row execute function public.set_attendance_points();

alter table public.attendance_records enable row level security;

insert into public.permissions (key, description) values
  ('attendance.view', 'Melihat kehadiran dan rekap poin'),
  ('attendance.manage', 'Mencatat dan mengubah kehadiran')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.name = 'Super Admin' and p.key in ('attendance.view', 'attendance.manage')
on conflict do nothing;

create policy "members read attendance" on public.attendance_records
  for select to authenticated using (has_permission('attendance.view') or member_id = auth.uid());
create policy "attendance managers insert attendance" on public.attendance_records
  for insert to authenticated with check (has_permission('attendance.manage'));
create policy "attendance managers update attendance" on public.attendance_records
  for update to authenticated using (has_permission('attendance.manage')) with check (has_permission('attendance.manage'));
create policy "attendance managers delete attendance" on public.attendance_records
  for delete to authenticated using (has_permission('attendance.manage'));

commit;
