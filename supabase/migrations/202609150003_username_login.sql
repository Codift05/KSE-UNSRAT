begin;

-- Anggota masuk dengan username, bukan email. Email internal dibentuk dari nomor
-- peserta KSE dan tidak pernah dilihat siapa pun, sehingga menuntut orang
-- mengetiknya hanya menyulitkan tanpa menambah keamanan.
--
-- Supabase Auth tetap memakai email sebagai identitas internal; username adalah
-- lapisan pencarian di atasnya. Berbeda dengan alias yang pernah ditulis tetap
-- di kode, pemetaan ini berada di basis data sehingga tidak menuntut perubahan
-- kode setiap kali ada pengurus baru.
alter table public.profiles add column if not exists username text;

-- Username dibentuk dari nama depan. Bila bentrok, nama kedua disambungkan;
-- bila masih bentrok, dibubuhi angka urut.
with kandidat as (
  select id, full_name,
    regexp_replace(lower(split_part(full_name, ' ', 1)), '[^a-z0-9]', '', 'g') as dasar,
    regexp_replace(lower(split_part(full_name, ' ', 2)), '[^a-z0-9]', '', 'g') as kedua
  from public.profiles
  where username is null
),
diurut as (
  select id, dasar, kedua, row_number() over (partition by dasar order by full_name) as urut
  from kandidat
)
update public.profiles p
set username = case
  when d.urut = 1 then d.dasar
  when d.kedua <> '' then d.dasar || d.kedua
  else d.dasar || d.urut::text
end
from diurut d
where d.id = p.id and p.username is null and d.dasar <> '';

-- Jaring pengaman: bila penyambungan nama kedua masih menghasilkan kembar,
-- yang belakangan dibubuhi angka.
with kembar as (
  select id, username, row_number() over (partition by lower(username) order by created_at) as urut
  from public.profiles where username is not null
)
update public.profiles p set username = p.username || k.urut::text
from kembar k where k.id = p.id and k.urut > 1;

create unique index if not exists profiles_username_unique on public.profiles (lower(username)) where username is not null;

commit;
