begin;

create extension if not exists pgcrypto;

create table public.periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint periods_valid_range check (starts_on < ends_on)
);

create unique index periods_one_active on public.periods (is_active) where is_active;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  university text default 'Universitas Sam Ratulangi',
  faculty text,
  study_program text,
  cohort_year smallint,
  kse_entry_year smallint,
  member_status text not null default 'active' check (member_status in ('active', 'inactive', 'alumni')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  period_id uuid references public.periods(id) on delete cascade,
  primary key (user_id, role_id, period_id)
);

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  name text not null,
  description text,
  coordinator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (period_id, name)
);

create table public.division_members (
  division_id uuid not null references public.divisions(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (division_id, member_id)
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (period_id, name)
);

create table public.management_members (
  period_id uuid not null references public.periods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  primary key (period_id, user_id, position_id)
);

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.key = permission_key
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.periods enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.divisions enable row level security;
alter table public.division_members enable row level security;
alter table public.positions enable row level security;
alter table public.management_members enable row level security;

create policy "authenticated users can read periods" on public.periods for select to authenticated using (true);
create policy "system managers manage periods" on public.periods for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));
create policy "authenticated users can read profiles" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "member managers manage profiles" on public.profiles for all to authenticated using (has_permission('member.update')) with check (has_permission('member.update'));

create policy "authenticated users read roles" on public.roles for select to authenticated using (true);
create policy "authenticated users read permissions" on public.permissions for select to authenticated using (true);
create policy "authenticated users read role permissions" on public.role_permissions for select to authenticated using (true);
create policy "authenticated users read user roles" on public.user_roles for select to authenticated using (true);
create policy "system managers manage roles" on public.roles for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));
create policy "system managers manage permissions" on public.permissions for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));
create policy "system managers manage role permissions" on public.role_permissions for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));
create policy "system managers manage user roles" on public.user_roles for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));

create policy "authenticated users read divisions" on public.divisions for select to authenticated using (true);
create policy "authenticated users read division members" on public.division_members for select to authenticated using (true);
create policy "authenticated users read positions" on public.positions for select to authenticated using (true);
create policy "authenticated users read management" on public.management_members for select to authenticated using (true);
create policy "member managers manage divisions" on public.divisions for all to authenticated using (has_permission('member.update')) with check (has_permission('member.update'));
create policy "member managers manage division members" on public.division_members for all to authenticated using (has_permission('member.update')) with check (has_permission('member.update'));
create policy "system managers manage positions" on public.positions for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));
create policy "system managers manage management" on public.management_members for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));

insert into public.permissions (key, description) values
  ('system.manage', 'Mengelola konfigurasi sistem'),
  ('member.view', 'Melihat anggota'),
  ('member.create', 'Menambahkan anggota'),
  ('member.update', 'Mengubah anggota dan struktur'),
  ('program.view', 'Melihat program'),
  ('program.create', 'Membuat program'),
  ('program.update', 'Mengubah program'),
  ('program.delete', 'Menghapus program'),
  ('task.create', 'Membuat tugas'),
  ('task.assign', 'Menugaskan anggota'),
  ('inventory.manage', 'Mengelola inventaris'),
  ('inventory.approve', 'Menyetujui peminjaman'),
  ('document.upload', 'Mengunggah dokumen'),
  ('document.delete', 'Menghapus dokumen');

insert into public.roles (name, description) values
  ('Super Admin', 'Akses penuh sistem'),
  ('Ketua', 'Monitoring dan pengelolaan organisasi'),
  ('Wakil Ketua', 'Monitoring dan pengelolaan organisasi'),
  ('Sekretaris', 'Administrasi dan dokumen'),
  ('Bendahara', 'Administrasi keuangan'),
  ('Koordinator Divisi', 'Pengelolaan divisi dan program'),
  ('Anggota', 'Akses anggota umum');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.name = 'Super Admin';

commit;
