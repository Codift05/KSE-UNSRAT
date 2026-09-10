begin;

-- PRD 5.2 memperlakukan Ketua dan Wakil Ketua sebagai satu tipe pengguna, dan
-- keduanya memang menerima izin yang sama persis. Dua role kembar cenderung
-- menyimpang seiring waktu: seseorang mengubah izin Ketua, lupa Wakil Ketua,
-- lalu wakil kehilangan akses tanpa alasan yang jelas.
--
-- Keduanya digabung menjadi satu role bernama netral. Menamainya "Ketua" akan
-- membuat kartu akun Wakil Ketua menuliskan "Ketua", yang keliru. Jabatan
-- sebenarnya tetap tercatat pada tabel positions dan terbaca di halaman
-- Kepengurusan; role hanya menentukan apa yang boleh dilakukan.

-- Pemegang Wakil Ketua dipindahkan lebih dulu agar tidak ada yang kehilangan akses.
insert into public.user_roles (user_id, role_id, period_id)
select ur.user_id, ketua.id, ur.period_id
from public.user_roles ur
join public.roles wakil on wakil.id = ur.role_id and wakil.name = 'Wakil Ketua'
cross join lateral (select id from public.roles where name = 'Ketua') as ketua
on conflict do nothing;

-- role_permissions dan user_roles yang tersisa ikut terhapus lewat on delete cascade.
delete from public.roles where name = 'Wakil Ketua';

update public.roles
set name = 'Pengurus Inti',
    description = 'Ketua dan Wakil Ketua: monitoring dan pengelolaan organisasi'
where name = 'Ketua';

commit;
