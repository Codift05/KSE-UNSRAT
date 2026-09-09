begin;

-- Migration operasional menyemai kategori dalam bahasa Inggris, sementara
-- seluruh antarmuka berbahasa Indonesia. Migration kategori sebelumnya
-- menambahkan padanan Indonesianya sehingga kedua versi berdampingan dan
-- pengurus melihat pilihan yang sama dua kali dengan nama berbeda.
--
-- Versi Inggris dihapus, bukan diubah namanya, karena padanan Indonesianya
-- sudah ada dan indeks unique (type, name) menolak nama kembar.
delete from public.categories where (type, name) in (
  ('document', 'SK'),
  ('inventory', 'Electronics'),
  ('inventory', 'Documentation'),
  ('inventory', 'Event Equipment'),
  ('inventory', 'Office Equipment'),
  ('program', 'Community Development'),
  ('program', 'Education'),
  ('program', 'Internal Development')
);

commit;
