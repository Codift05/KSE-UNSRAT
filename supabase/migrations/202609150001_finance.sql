begin;

-- Keuangan bendahara.
--
-- Pelajaran dari spreadsheet lama: saldo berjalan diketik manual, dan satu salah
-- ketik pada 7 September 2025 membuat seluruh saldo setahun berikutnya meleset
-- Rp410.000 tanpa ada yang menyadarinya. Karena itu saldo TIDAK PERNAH disimpan
-- di sini; ia selalu dihitung dari transaksi. Kolom yang bisa salah ketik
-- sengaja ditiadakan.

alter table public.categories drop constraint if exists categories_type_check;
alter table public.categories add constraint categories_type_check
  check (type in ('program', 'document', 'inventory', 'finance'));

-- Target iuran per anggota untuk satu periode. Diletakkan pada periode, bukan
-- ditulis tetap di kode, karena besarannya berubah antar kepengurusan.
alter table public.periods add column if not exists dues_target numeric(14,2) not null default 0
  check (dues_target >= 0);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  -- Satu baris = satu arah. Spreadsheet lama sempat memuat pemasukan dan
  -- pengeluaran pada baris yang sama sehingga dua kejadian berbeda menyamar
  -- sebagai satu transaksi.
  direction text not null check (direction in ('in', 'out')),
  amount numeric(14,2) not null check (amount > 0),
  -- Wajib diisi. Pada spreadsheet lama 37 dari 129 baris mengosongkan tanggal
  -- dan mewarisinya dari baris di atas; hubungan itu putus begitu diurutkan.
  occurred_on date not null,
  description text not null,
  note text,
  -- Kolom bukti pada spreadsheet lama tidak pernah terisi karena berkas tidak
  -- dapat disimpan di sana. Di sini bukti mengarah ke berkas Google Drive.
  proof_drive_file_id text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index finance_transactions_period_date on public.finance_transactions (period_id, occurred_on);

-- Iuran dipisahkan dari kas umum. Pada spreadsheet lama, Rp30,3 juta iuran hanya
-- berketerangan "6 orang" atau "12 orang", sehingga pertanyaan paling dasar
-- seorang bendahara - siapa yang belum membayar - tidak dapat dijawab.
create table public.member_dues (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  -- Satu pembayaran tunai dapat mencakup beberapa anggota sekaligus, persis
  -- seperti kebiasaan lama "480.000 untuk 2 orang".
  transaction_id uuid references public.finance_transactions(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  paid_on date not null,
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index member_dues_period_member on public.member_dues (period_id, member_id);

create trigger finance_transactions_updated
  before update on public.finance_transactions
  for each row execute function public.set_updated_at();

alter table public.finance_transactions enable row level security;
alter table public.member_dues enable row level security;

create policy "finance viewers read transactions" on public.finance_transactions
  for select to authenticated using (has_permission('finance.view'));
create policy "finance managers write transactions" on public.finance_transactions
  for all to authenticated using (has_permission('finance.manage')) with check (has_permission('finance.manage'));

-- Anggota selalu boleh melihat catatan iurannya sendiri, sekalipun tanpa izin
-- keuangan; itu uangnya sendiri.
create policy "members read own dues" on public.member_dues
  for select to authenticated using (member_id = auth.uid() or has_permission('finance.view'));
create policy "finance managers write dues" on public.member_dues
  for all to authenticated using (has_permission('finance.manage')) with check (has_permission('finance.manage'));

insert into public.permissions (key, description) values
  ('finance.view', 'Melihat laporan keuangan dan iuran'),
  ('finance.manage', 'Mencatat transaksi keuangan dan iuran')
on conflict (key) do nothing;

insert into public.categories (type, name) values
  ('finance', 'Iuran Anggota'),
  ('finance', 'Sekretariat'),
  ('finance', 'Listrik'),
  ('finance', 'Internet'),
  ('finance', 'Air'),
  ('finance', 'Sampah'),
  ('finance', 'KSE Peduli'),
  ('finance', 'KSE Graduation'),
  ('finance', 'Konsumsi Rapat'),
  ('finance', 'Administrasi Bank'),
  ('finance', 'Inventaris'),
  ('finance', 'Kegiatan dan Program'),
  ('finance', 'Sponsor dan Donasi'),
  ('finance', 'Lainnya')
on conflict (type, name) do nothing;

-- Bendahara memegang kendali penuh keuangan; Pengurus Inti dan Super Admin ikut
-- karena keduanya bertanggung jawab atas seluruh organisasi. Sekretaris dan
-- Koordinator cukup melihat. Anggota tidak diberi izin keuangan, tetapi tetap
-- dapat melihat catatan iurannya sendiri lewat kebijakan RLS di atas.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('Super Admin', 'finance.view'), ('Super Admin', 'finance.manage'),
  ('Pengurus Inti', 'finance.view'), ('Pengurus Inti', 'finance.manage'),
  ('Bendahara', 'finance.view'), ('Bendahara', 'finance.manage'),
  ('Sekretaris', 'finance.view'),
  ('Koordinator Divisi', 'finance.view')
) as matriks(role_name, permission_key)
join public.roles r on r.name = matriks.role_name
join public.permissions p on p.key = matriks.permission_key
on conflict do nothing;

commit;
