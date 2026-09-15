begin;

-- Data resmi beswan dari KSE memuat dua identitas yang sebelumnya tidak punya
-- tempat: nomor peserta KSE dan NIM universitas. Keduanya dipakai untuk
-- mencocokkan orang saat rekonsiliasi dengan berkas dari pusat, jadi menyimpannya
-- di kolom catatan bebas akan membuatnya tidak dapat dicari maupun dijaga unik.
alter table public.profiles
  add column if not exists kse_id text,
  add column if not exists student_id text;

-- Unik hanya bila terisi, sebab anggota lama boleh jadi belum memiliki keduanya.
create unique index if not exists profiles_kse_id_unique on public.profiles (kse_id) where kse_id is not null;
create unique index if not exists profiles_student_id_unique on public.profiles (student_id) where student_id is not null;

commit;
