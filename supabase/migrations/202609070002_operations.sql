begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('program', 'document', 'inventory')),
  name text not null,
  created_at timestamptz not null default now(),
  unique (type, name)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  pic_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  starts_on date,
  ends_on date,
  target text,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  status text not null default 'planning' check (status in ('planning', 'ongoing', 'evaluation', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_valid_range check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

create table public.program_members (
  program_id uuid not null references public.programs(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (program_id, member_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  starts_on date,
  due_on date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_valid_range check (starts_on is null or due_on is null or starts_on <= due_on)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  description text,
  type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  participant_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint events_valid_range check (ends_at is null or starts_at <= ends_at)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  code text not null unique,
  name text not null,
  quantity integer not null default 1 check (quantity >= 0),
  available_quantity integer not null default 1 check (available_quantity >= 0 and available_quantity <= quantity),
  status text not null default 'available' check (status in ('available', 'borrowed', 'under_repair', 'damaged', 'lost')),
  condition text not null default 'good' check (condition in ('good', 'minor_damage', 'damaged')),
  location text,
  acquired_on date,
  source text,
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  borrower_id uuid not null references public.profiles(id) on delete restrict,
  program_id uuid references public.programs(id) on delete set null,
  quantity integer not null check (quantity > 0),
  purpose text not null,
  borrowed_on date not null,
  expected_return_on date not null,
  returned_on date,
  return_condition text check (return_condition in ('good', 'minor_damage', 'damaged')),
  status text not null default 'waiting_approval' check (status in ('waiting_approval', 'approved', 'borrowed', 'returned', 'condition_check', 'completed', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_transaction_valid_range check (borrowed_on <= expected_return_on)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  period_id uuid not null references public.periods(id) on delete cascade,
  uploader_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  visibility text not null default 'members' check (visibility in ('members', 'management', 'private')),
  drive_file_id text,
  drive_folder_id text,
  mime_type text,
  created_at timestamptz not null default now(),
  constraint documents_drive_target check (drive_file_id is not null or drive_folder_id is not null)
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger inventory_items_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger inventory_transactions_updated_at before update on public.inventory_transactions for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.programs enable row level security;
alter table public.program_members enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

create policy "members read categories" on public.categories for select to authenticated using (true);
create policy "system managers manage categories" on public.categories for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));

create policy "members read programs" on public.programs for select to authenticated using (has_permission('program.view'));
create policy "program creators insert programs" on public.programs for insert to authenticated with check (has_permission('program.create'));
create policy "program managers update programs" on public.programs for update to authenticated using (has_permission('program.update')) with check (has_permission('program.update'));
create policy "program managers delete programs" on public.programs for delete to authenticated using (has_permission('program.delete'));
create policy "members read program team" on public.program_members for select to authenticated using (has_permission('program.view'));
create policy "program managers manage team" on public.program_members for all to authenticated using (has_permission('program.update')) with check (has_permission('program.update'));

create policy "assignees read tasks" on public.tasks for select to authenticated using (assignee_id = auth.uid() or has_permission('program.view'));
create policy "task creators insert tasks" on public.tasks for insert to authenticated with check (has_permission('task.create'));
create policy "assignees update tasks" on public.tasks for update to authenticated using (assignee_id = auth.uid() or has_permission('task.assign')) with check (assignee_id = auth.uid() or has_permission('task.assign'));
create policy "task managers delete tasks" on public.tasks for delete to authenticated using (has_permission('task.assign'));

create policy "members read events" on public.events for select to authenticated using (true);
create policy "program managers manage events" on public.events for all to authenticated using (has_permission('program.update')) with check (has_permission('program.update'));

create policy "members read inventory" on public.inventory_items for select to authenticated using (true);
create policy "inventory managers manage inventory" on public.inventory_items for all to authenticated using (has_permission('inventory.manage')) with check (has_permission('inventory.manage'));
create policy "borrowers read own transactions" on public.inventory_transactions for select to authenticated using (borrower_id = auth.uid() or has_permission('inventory.manage'));
create policy "members request inventory" on public.inventory_transactions for insert to authenticated with check (borrower_id = auth.uid());
create policy "inventory approvers update transactions" on public.inventory_transactions for update to authenticated using (has_permission('inventory.approve')) with check (has_permission('inventory.approve'));

create policy "members read documents" on public.documents for select to authenticated using (visibility = 'members' or uploader_id = auth.uid() or has_permission('system.manage'));
create policy "document uploaders insert documents" on public.documents for insert to authenticated with check (uploader_id = auth.uid() and has_permission('document.upload'));
create policy "document uploaders update documents" on public.documents for update to authenticated using (uploader_id = auth.uid() or has_permission('system.manage')) with check (uploader_id = auth.uid() or has_permission('system.manage'));
create policy "document managers delete documents" on public.documents for delete to authenticated using (has_permission('document.delete'));

create policy "members read activity" on public.activity_logs for select to authenticated using (true);
create policy "authenticated users create activity" on public.activity_logs for insert to authenticated with check (actor_id = auth.uid());
create policy "system managers read settings" on public.settings for select to authenticated using (has_permission('system.manage'));
create policy "system managers manage settings" on public.settings for all to authenticated using (has_permission('system.manage')) with check (has_permission('system.manage'));

insert into public.categories (type, name) values
  ('program', 'Community Development'),
  ('program', 'Education'),
  ('program', 'Internal Development'),
  ('document', 'Proposal'),
  ('document', 'LPJ'),
  ('document', 'Notulen'),
  ('document', 'SK'),
  ('inventory', 'Electronics'),
  ('inventory', 'Documentation'),
  ('inventory', 'Event Equipment'),
  ('inventory', 'Office Equipment');

commit;
