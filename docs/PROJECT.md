# KSE Management System: Panduan Implementasi

Dokumen ini adalah sumber arah pengembangan. Perbarui bagian status dan keputusan setiap kali sebuah fitur selesai atau arah teknis berubah. Kebutuhan produk lengkap tetap berada di [PRD](./PRD.md).

## Tujuan MVP

Menyediakan satu aplikasi internal responsif untuk mengelola periode, anggota, struktur organisasi, divisi, program, tugas, inventaris, dokumen, dan akses berdasarkan role.

## Prinsip pengerjaan

- Satu vertical slice diselesaikan dari database sampai UI sebelum berpindah modul.
- Gunakan fitur bawaan Next.js, React, PostgreSQL, dan Supabase sebelum menambah dependency.
- Data operasional berasal dari Supabase. Data demo hanya digunakan sampai tabel terkait tersedia.
- File fisik disimpan di Google Drive. Supabase hanya menyimpan metadata dan relasi.
- Validasi dan authorization wajib dilakukan di server.
- Fitur P2 dan P3 tidak dikerjakan sebelum P0 stabil.

## Status saat ini

| Area | Status | Catatan |
| --- | --- | --- |
| Fondasi Next.js dan TypeScript | Selesai | Next.js App Router, build produksi lulus |
| Shell dan navigasi responsif | Selesai | Desktop dan mobile sidebar |
| Dashboard | UI siap | Belum membaca data Supabase |
| Dokumen | UI siap | Monitoring, tabel, filter, dan folder Drive masih data demo |
| Supabase | Terhubung | Server SDK dan health endpoint tersedia |
| Authentication | Selesai | Login, reset password, session refresh, proteksi terpusat, dan logout |
| Database schema dan RLS | Migration siap | Dua migration tersedia dan belum diterapkan |
| Role dan permission | Migration siap | Menunggu migration dan integrasi UI |
| Periode, anggota, struktur, divisi | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Agenda dan activity log | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Program dan tugas | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Google Drive | Belum | Memerlukan credential Google server-side |
| Inventaris dan peminjaman | UI + migration siap | Menunggu migration dan integrasi CRUD |

## Urutan implementasi

### Foundation

1. Terapkan migration Foundation yang sudah tersedia.
2. Supabase Auth: login, logout, reset password, session.
3. RLS dan helper authorization server-side.
4. CRUD periode dengan aturan hanya satu periode aktif.
5. CRUD anggota, divisi, jabatan, dan struktur kepengurusan.

### Operations

1. Program dan anggota program.
2. Task, assignee, status, priority, dan deadline.
3. Progress program dari task selesai.
4. Agenda dan kalender.
5. Dashboard membaca agregasi sesuai role dan divisi.

### Asset dan dokumen

1. Inventaris, kategori dinamis, dan histori.
2. Alur peminjaman dan approval.
3. Credential serta folder Google Drive.
4. Upload file dan penyimpanan metadata dokumen.
5. Activity log untuk mutasi penting.

### Setelah P0 stabil

Program evaluation, reporting dasar, attendance, finance, letters, analytics, notification, dan fitur P3.

## Arsitektur aktif

```text
Browser
  -> Next.js App Router di Vercel
     -> Server Components / Route Handlers
        -> Supabase Auth dan PostgreSQL
        -> Google Drive API untuk file
```

Aturan batas:

- Browser tidak pernah menerima service-role key atau Google credential.
- Client memakai session pengguna dan anon key saat fitur auth tersedia.
- Operasi admin atau lintas pengguna dilakukan server-side setelah permission diperiksa.
- Dashboard hanya mengambil metadata dan agregasi, bukan file Drive.

## Struktur kode

```text
app/                     routes dan API
components/              komponen UI bersama
lib/supabase/            client Supabase server-side
public/                  aset statis dan logo resmi
docs/PRD.md              kebutuhan produk lengkap
docs/PROJECT.md          arah, status, dan keputusan implementasi
```

Feature folder baru ditambahkan hanya ketika modul pertama benar-benar diimplementasikan. Hindari scaffold kosong.

## Sistem visual

- Karakter: aplikasi kerja yang bersih, tenang, profesional, dan padat informasi.
- Referensi: Linear, GitHub, dan Vercel Dashboard. Bukan landing page promosi.
- Warna utama: hijau KSE `#176b4d`, neutral background `#f5f7f6`.
- Satu accent color. Status bahaya dan peringatan hanya untuk makna semantik.
- Radius utama `12px`; kontrol menggunakan `8px` sampai `9px`.
- Font saat ini menggunakan system sans-serif untuk performa dan tanpa request jaringan.
- Gunakan Phosphor Icons saja. Jangan membuat SVG icon manual.
- Gunakan card hanya untuk grouping data yang nyata.
- Semua halaman harus responsif pada 430px, 760px, dan desktop.
- Semua kontrol harus memiliki focus state, label, contrast yang terbaca, serta target sentuh yang layak.
- Motion hanya untuk feedback perubahan state. Hormati `prefers-reduced-motion`.

## Route aktif

| Route | Fungsi |
| --- | --- |
| `/` | Dashboard demo |
| `/documents` | Monitoring dan pusat dokumentasi demo, wajib login |
| `/login` | Login dengan Supabase Auth |
| `/forgot-password` | Meminta tautan reset password |
| `/update-password` | Menyimpan password baru dari recovery session |
| `/members` | Database anggota |
| `/management` | Struktur kepengurusan |
| `/divisions` | Divisi dan koordinator |
| `/periods` | Periode kepengurusan |
| `/programs` | Monitoring program kerja |
| `/tasks` | Tugas pengguna |
| `/calendar` | Agenda organisasi |
| `/inventory` | Inventaris dan peminjaman |
| `/activity` | Log aktivitas |
| `/settings` | Konfigurasi sistem |
| `/api/health/supabase` | Pemeriksaan koneksi Supabase server-side |

## Environment

Gunakan `.env.local` berdasarkan `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Jangan commit `.env.local`. Service-role key yang pernah dibagikan melalui chat harus di-rotate sebelum deployment.

## Definition of done per fitur

- Alur utama bekerja dengan data Supabase, bukan hanya mock.
- Loading, empty, error, dan success state tersedia.
- Authorization diperiksa pada server.
- UI dapat digunakan dengan keyboard serta pada mobile.
- Mutasi penting tercatat di activity log jika tabelnya sudah tersedia.
- `npm run lint` dan `npm run build` lulus.
- Status pada dokumen ini diperbarui.

## Keputusan aktif

| Tanggal | Keputusan | Alasan |
| --- | --- | --- |
| 2026-09-07 | Next.js App Router + TypeScript | Sesuai PRD dan target Vercel |
| 2026-09-07 | CSS native, tanpa UI framework tambahan | UI saat ini kecil dan sudah konsisten |
| 2026-09-07 | Phosphor Icons sebagai satu-satunya keluarga icon | Konsistensi visual |
| 2026-09-07 | Supabase service-role hanya pada server | Mencegah privilege admin bocor ke browser |
| 2026-09-07 | Google Drive untuk file, Supabase untuk metadata | Sesuai batas free tier dan PRD |
| 2026-09-07 | Verifikasi session hanya di Proxy | Menghindari request auth berulang pada setiap navigasi |

## Langkah berikutnya

Terapkan kedua file dalam `supabase/migrations` secara berurutan melalui SQL Editor Supabase atau berikan database password untuk menjalankannya dari CLI. Setelah itu buat akun Super Admin, hubungkan seluruh tabel UI ke query Supabase, dan konfigurasi Google Drive.
