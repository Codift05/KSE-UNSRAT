begin;

-- Sebelumnya hanya Super Admin yang memiliki izin, sehingga enam role lain ada
-- namanya saja dan sistem praktis hanya dapat dipakai satu orang. Matriks di
-- bawah menjadi titik awal yang masuk akal; pengurus tetap dapat mengubahnya
-- lewat halaman Pengaturan tanpa menyentuh kode.
--
-- Dua keputusan yang disengaja:
--   * `system.manage` hanya milik Super Admin. Izin itu dapat mengubah izin
--     orang lain, jadi memberikannya ke lebih dari satu jabatan membuka
--     kemungkinan dua orang saling mencabut akses.
--   * Anggota tetap memperoleh empat izin baca. Dengan nol izin, hampir seluruh
--     halaman tertutup dan aplikasi terasa rusak bagi mereka, bukan terbatas.
--
-- Ketua dan Wakil Ketua memperoleh izin yang sama persis, sesuai PRD 5.2 yang
-- memperlakukan keduanya sebagai satu tipe pengguna.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('Ketua', 'member.view'), ('Ketua', 'member.create'), ('Ketua', 'member.update'),
  ('Ketua', 'program.view'), ('Ketua', 'program.create'), ('Ketua', 'program.update'), ('Ketua', 'program.delete'),
  ('Ketua', 'task.create'), ('Ketua', 'task.assign'),
  ('Ketua', 'inventory.manage'), ('Ketua', 'inventory.approve'),
  ('Ketua', 'document.upload'), ('Ketua', 'document.delete'),
  ('Ketua', 'attendance.view'), ('Ketua', 'attendance.manage'),

  ('Wakil Ketua', 'member.view'), ('Wakil Ketua', 'member.create'), ('Wakil Ketua', 'member.update'),
  ('Wakil Ketua', 'program.view'), ('Wakil Ketua', 'program.create'), ('Wakil Ketua', 'program.update'), ('Wakil Ketua', 'program.delete'),
  ('Wakil Ketua', 'task.create'), ('Wakil Ketua', 'task.assign'),
  ('Wakil Ketua', 'inventory.manage'), ('Wakil Ketua', 'inventory.approve'),
  ('Wakil Ketua', 'document.upload'), ('Wakil Ketua', 'document.delete'),
  ('Wakil Ketua', 'attendance.view'), ('Wakil Ketua', 'attendance.manage'),

  ('Sekretaris', 'member.view'), ('Sekretaris', 'member.create'), ('Sekretaris', 'member.update'),
  ('Sekretaris', 'program.view'),
  ('Sekretaris', 'task.create'), ('Sekretaris', 'task.assign'),
  ('Sekretaris', 'inventory.manage'), ('Sekretaris', 'inventory.approve'),
  ('Sekretaris', 'document.upload'), ('Sekretaris', 'document.delete'),
  ('Sekretaris', 'attendance.view'), ('Sekretaris', 'attendance.manage'),

  ('Bendahara', 'member.view'),
  ('Bendahara', 'program.view'),
  ('Bendahara', 'inventory.approve'),
  ('Bendahara', 'document.upload'),
  ('Bendahara', 'attendance.view'),

  ('Koordinator Divisi', 'member.view'),
  ('Koordinator Divisi', 'program.view'), ('Koordinator Divisi', 'program.create'), ('Koordinator Divisi', 'program.update'),
  ('Koordinator Divisi', 'task.create'), ('Koordinator Divisi', 'task.assign'),
  ('Koordinator Divisi', 'document.upload'),
  ('Koordinator Divisi', 'attendance.view'),

  ('Anggota', 'member.view'),
  ('Anggota', 'program.view'),
  ('Anggota', 'document.upload'),
  ('Anggota', 'attendance.view')
) as matriks(role_name, permission_key)
join public.roles r on r.name = matriks.role_name
join public.permissions p on p.key = matriks.permission_key
on conflict do nothing;

commit;
