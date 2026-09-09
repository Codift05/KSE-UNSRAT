begin;

-- Kategori dipakai formulir dokumen dan inventaris. Tanpa isi awal, kedua
-- dropdown kosong dan pengurus tidak punya titik mulai. Nilai di bawah mengikuti
-- struktur folder pada PRD 8.17 dan dapat diubah kemudian lewat sistem.
insert into public.categories (type, name) values
  ('document', 'Proposal'),
  ('document', 'LPJ'),
  ('document', 'Notulen'),
  ('document', 'Surat Keputusan'),
  ('document', 'Surat Menyurat'),
  ('document', 'Dokumentasi'),
  ('inventory', 'Elektronik'),
  ('inventory', 'Dokumentasi'),
  ('inventory', 'Perlengkapan Acara'),
  ('inventory', 'Alat Tulis'),
  ('program', 'Pendidikan'),
  ('program', 'Sosial'),
  ('program', 'Internal'),
  ('program', 'Hubungan Masyarakat')
on conflict (type, name) do nothing;

commit;
