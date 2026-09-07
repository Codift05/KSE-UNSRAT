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
