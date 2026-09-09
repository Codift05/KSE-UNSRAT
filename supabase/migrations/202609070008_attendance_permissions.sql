begin;

-- Kedua permission ini sudah dipakai kode kehadiran tetapi sebelumnya hanya
-- ditambahkan langsung di database, sehingga tidak ikut terbawa ke lingkungan
-- baru. Ditulis idempoten agar aman dijalankan di database yang sudah memilikinya.
insert into public.permissions (key, description) values
  ('attendance.view', 'Melihat kehadiran dan rekap poin'),
  ('attendance.manage', 'Mencatat dan mengubah kehadiran')
on conflict (key) do nothing;

-- Super Admin memegang seluruh permission, termasuk yang baru ditambahkan.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Super Admin'
on conflict do nothing;

commit;
