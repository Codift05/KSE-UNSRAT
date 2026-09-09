# KSE Management System

Vertical slice awal berdasarkan PRD Paguyuban KSE Unsrat.

Dokumentasi arah pengembangan tersedia di [docs/PROJECT.md](docs/PROJECT.md), sedangkan kebutuhan produk lengkap tersimpan di [docs/PRD.md](docs/PRD.md).

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Cakupan saat ini

- Dashboard responsif untuk desktop dan mobile
- Navigasi information architecture MVP
- Ringkasan program, tugas, agenda, inventaris, dan aktivitas
- Struktur Next.js + TypeScript siap untuk integrasi Supabase dan Google Drive

Data yang tampil masih data demo. Status implementasi terbaru dicatat di `docs/PROJECT.md`.

## Supabase

Salin `.env.example` menjadi `.env.local`, lalu isi URL project dan service role key. Key tersebut hanya boleh dipakai oleh kode server.

Koneksi dapat diperiksa melalui `GET /api/health/supabase`.

Migration Foundation tersedia di `supabase/migrations/202609070001_foundation.sql`. Jalankan melalui SQL Editor Supabase sebelum mengaktifkan fitur CRUD.

## Google Drive

Arsip disimpan di Google Drive, metadatanya di Supabase.

Integrasi memakai OAuth refresh token milik satu akun Google organisasi, bukan
service account: service account tidak punya kuota penyimpanan Drive sendiri
sehingga hanya bekerja pada Shared Drive milik Google Workspace berbayar.

Penyiapan:

1. Google Cloud Console: buat project, aktifkan Google Drive API.
2. OAuth consent screen: External, lalu **Publish app**. Selama status masih
   Testing, refresh token kedaluwarsa setiap tujuh hari.
3. Credentials: buat OAuth client ID bertipe **Desktop app**.
4. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` pada `.env.local`.
5. Jalankan `node scripts/google-drive-token.mjs`, setujui akses, lalu salin
   `GOOGLE_REFRESH_TOKEN` yang dicetak.
6. Buat folder induk di Drive, salin ID dari URL setelah `/folders/`, isikan ke
   `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

Scope yang dipakai hanya `drive.file`, sehingga aplikasi tidak dapat menyentuh
berkas lain di Drive akun tersebut.

## Pengujian

- `npm test` — uji fungsi murni (validasi, format waktu, perhitungan). Cepat,
  tanpa jaringan, aman dijalankan kapan saja.
- `npm run test:integration` — uji kontrak database: trigger, constraint, dan
  cascade yang tidak dapat dijangkau uji fungsi murni.

Integration test berjalan terhadap database Supabase sungguhan karena trigger
dan constraint hanya hidup di sana. Karena itu:

- Setiap berkas wajib memanggil `beginSuite` dan `endSuite`. Keduanya mencatat
  periode yang sedang aktif lalu mengembalikannya, sebab mengaktifkan periode
  uji menonaktifkan periode nyata dan membuat aplikasi kehilangan konteksnya.
- Seluruh data uji memakai awalan `__uji__` (atau `UJI-` untuk kode barang) dan
  dibersihkan sebelum maupun sesudah setiap berkas.
- Berkas dijalankan berurutan (`--test-concurrency=1`). Menjalankannya paralel
  membuat pembersihan satu berkas menghapus data uji berkas lain sekaligus
  memperebutkan periode aktif.

Uji ini tidak menjangkau tampilan. Bug seperti kontrol formulir tanpa gaya atau
tombol yang tampil sebagai tautan hanya terlihat dengan membuka halamannya.
