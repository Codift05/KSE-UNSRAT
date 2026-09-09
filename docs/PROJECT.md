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
| Profil pengguna | Selesai | Menu akun dan edit data profil mandiri tersedia |
| Manajemen akun | Implementasi siap | Super Admin dapat membuat, menonaktifkan, reset password, dan menghapus akun Supabase |
| Database schema dan RLS | Diterapkan | Tujuh migration tercatat di `supabase_migrations.schema_migrations` lewat Supabase CLI |
| Role dan permission | Migration siap | Menunggu migration dan integrasi UI |
| Periode | Implementasi siap | CRUD, aktivasi satu periode via `set_active_period`, arsip, dan hapus dengan penjagaan |
| Anggota | Implementasi siap | Edit data, status anggota, dan penetapan divisi periode aktif; pembuatan anggota lewat halaman Akun |
| Divisi | Implementasi siap | CRUD divisi periode aktif, koordinator, dan kelola anggota dari dua sisi |
| Struktur kepengurusan | Implementasi siap | CRUD jabatan dengan urutan, penetapan pengurus ke jabatan dan divisi |
| Agenda dan activity log | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Program dan tugas | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Google Drive | Belum | Memerlukan credential Google server-side |
| Inventaris dan peminjaman | UI + migration siap | Menunggu migration dan integrasi CRUD |
| Kehadiran dan rekap poin | Implementasi siap | Input, rekap, rincian beswan privat, riwayat, activity log, dan fallback schema tersedia |

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

Program evaluation, reporting dasar, finance, letters, analytics, notification, dan fitur P3.

### Kehadiran dan poin

1. Kegiatan offline bernilai 20 poin dan online 10 poin untuk kehadiran penuh.
2. Hadir sebagian bernilai 50%, Terlambat sementara bernilai penuh, Izin 0, dan Alpa mengikuti pengurangan kegiatan.
3. Pengurus mencatat satu status untuk setiap beswan pada satu kegiatan.
4. Poin hasil pencatatan disimpan sebagai snapshot agar histori tidak berubah jika aturan kegiatan diedit.
5. Rekap menampilkan total poin dan jumlah setiap status per beswan dalam periode aktif.
6. Surat izin disimpan sebagai URL bukti. Verifikasi berkas dapat ditambahkan setelah alur dasar stabil.
7. CSV lama menjadi sumber migrasi, bukan bentuk utama antarmuka harian.
8. Rekap diurutkan menjadi peringkat poin. Keaktifan memakai rasio hadir, terlambat, dan hadir sebagian terhadap catatan non-izin.
9. Peringatan disiplin otomatis: SP1 pada 3–5 alpa, SP2 pada 6–7 alpa, dan SP3 mulai 8 alpa.
10. Status anggota tetap ditampilkan terpisah dari disiplin; anggota pindah/nonaktif tidak tersedia pada form kehadiran baru tetapi histori dan peringkatnya tetap terlihat.
11. Pengurus dapat membuka sesi absensi mandiri dengan link, kode singkat, waktu aktif, dan radius lokasi untuk kegiatan offline.
12. Beswan wajib login, hanya dapat mengirim satu catatan per kegiatan, dan lokasi hanya diambil saat check-in/check-out.
13. Absensi mandiri berstatus menunggu verifikasi dan belum memberi poin sampai disetujui pengurus.
14. Check-out sebelum durasi minimum mengusulkan status Hadir sebagian; keputusan akhir tetap pada pengurus.
15. Lokasi desktop yang sangat kasar tetap dapat dikirim sebagai catatan pending bertanda akurasi rendah; lokasi akurat di luar radius tetap ditolak.

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
src/app/                  route, layout, API, dan Server Actions
src/frontend/components/ komponen dan interaksi antarmuka
src/backend/             query, auth helper, dan akses Supabase
supabase/migrations/     schema PostgreSQL dan RLS
public/                  aset statis dan logo resmi
docs/                    PRD, status, dan keputusan implementasi
```

`src/app` hanya menjadi lapisan routing dan composition. Logika tampilan berada di `src/frontend`, sedangkan akses data serta credential server berada di `src/backend`.

## Sistem visual

- Karakter: aplikasi kerja yang bersih, tenang, profesional, dan padat informasi.
- Referensi: Linear, GitHub, dan Vercel Dashboard. Bukan landing page promosi.
- Warna utama: hijau KSE `#176b4d`, neutral background `#f5f7f6`.
- Satu accent color. Status bahaya dan peringatan hanya untuk makna semantik.
- Radius utama `12px`; kontrol menggunakan `8px` sampai `9px`.
- Font utama menggunakan Geist dari package lokal agar konsisten di development dan Vercel tanpa request font eksternal dari browser.
- Halaman autentikasi memakai komposisi editorial: identitas dan konteks di kiri, form fokus di kanan, serta latar gelombang mint–biru es yang tetap memakai hijau KSE sebagai accent utama.
- Latar autentikasi berada di `public/kse-auth-background.png`; logo transparan berada di `public/pskse-logo-transparent.png`. Aset latar tidak memuat teks atau logo sehingga copy tetap berupa HTML yang aksesibel dan responsif.
- Navigasi antarrute memakai progress bar tipis global dari `nextjs-toploader`; halaman aktif tetap terlihat sampai rute berikutnya siap sehingga shell tidak berkedip atau berubah menjadi skeleton penuh.
- Gunakan Phosphor Icons saja. Jangan membuat SVG icon manual.
- Gunakan card hanya untuk grouping data yang nyata.
- Semua halaman harus responsif pada 430px, 760px, dan desktop.
- Semua kontrol harus memiliki focus state, label, contrast yang terbaca, serta target sentuh yang layak.
- Motion hanya untuk feedback perubahan state. Hormati `prefers-reduced-motion`.
- Jangan memakai eyebrow dekoratif, micro-label kapital, atau letter-spacing lebar untuk membangun hierarki. Gunakan judul yang jelas, bobot font, dan ruang.
- Header tabel dan judul kelompok navigasi memakai sentence case; uppercase hanya untuk singkatan resmi seperti KSE, LPJ, atau SK.
- Panel autentikasi memakai permukaan putih solid, border tunggal, dan tanpa glow atau decorative icon. Field aktif ditandai border abu-abu netral tanpa warna accent atau glow.
- Pada mobile, autentikasi memprioritaskan form: hero copy disembunyikan, logo dipadatkan, kartu dibatasi 330-340px, safe-area dihormati, dan input memakai ukuran 16px untuk mencegah zoom otomatis iOS.
- Skala tipografi aplikasi dibatasi: 11px metadata/status, 12px keterangan, 13-14px isi, 15px judul panel, 27-30px judul halaman desktop, dan 22px pada mobile. Bobot utama hanya 500, 600, dan 700.
- Logo sidebar dibatasi 110px agar identitas organisasi tidak mengalahkan navigasi dan konten.
- Dashboard mobile memakai KPI 2x2, action satu baris, dan gap panel 14-16px. KPI hanya kembali satu kolom pada viewport di bawah 340px.

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
| `/attendance` | Pencatatan kehadiran dan rekap poin beswan |
| `/check-in/[token]` | Check-in dan check-out mandiri melalui sesi kegiatan terbatas |
| `/points/[memberId]` | Rincian sumber poin yang dapat dibagikan secara privat |
| `/profile` | Pengaturan profil pengguna aktif |
| `/accounts` | Manajemen akun login beswan oleh Super Admin |
| `/activity` | Log aktivitas |
| `/settings` | Konfigurasi sistem |
| `/api/health/supabase` | Pemeriksaan koneksi Supabase server-side |

## Environment

Gunakan `.env.local` berdasarkan `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_MIFTAH_EMAIL=
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
| 2026-09-07 | Pertahankan Next.js dan gunakan Link prefetch | Bottleneck berada pada jaringan Supabase, bukan rendering framework |
| 2026-09-07 | Geist dan visual autentikasi soft-tech KSE | Memodernkan tipografi serta login tanpa mengubah alur Supabase atau identitas organisasi |
| 2026-09-07 | Top loader global menggantikan root skeleton | Menjaga konteks halaman saat navigasi dan menghindari redraw sidebar, tabel, serta pagination palsu |
| 2026-09-07 | Poin kehadiran dikonfigurasi per kegiatan dan disimpan sebagai snapshot | Nilai kegiatan pada spreadsheet lama berbeda-beda dan histori tidak boleh berubah secara retroaktif |
| 2026-09-07 | Nama profil dikirim bersama render server | Menghapus identitas demo dan perubahan teks sesaat ketika halaman dimuat ulang |
| 2026-09-07 | Cache baca pendek dengan invalidasi setelah mutasi | Mengurangi perjalanan berulang ke Supabase tanpa membuat data hasil edit tertinggal |
| 2026-09-07 | Absensi mandiri selalu menunggu verifikasi | Link, GPS, dan kode mengurangi penyalahgunaan tetapi tidak menggantikan keputusan pengurus |
| 2026-09-09 | Akun dikelola langsung melalui Supabase Auth | Satu identitas untuk login dan profil anggota; tidak ada registrasi mandiri beswan |
| 2026-09-09 | Aktivasi periode memakai fungsi database `set_active_period` | Indeks `periods_one_active` hanya memuat satu baris aktif, sehingga penonaktifan dan pengaktifan tidak boleh terpisah menjadi dua permintaan |
| 2026-09-09 | Penetapan divisi hanya mengganti penugasan pada periode aktif | Histori divisi periode sebelumnya harus tetap utuh untuk rekap dan laporan |
| 2026-09-09 | Satu anggota menempati satu divisi per periode, diatur satu tempat di `division-assignment.ts` | Halaman Anggota dan halaman Divisi sama-sama mengubah penugasan, sehingga aturannya tidak boleh digandakan |
| 2026-09-09 | Halaman modul memeriksa permission sendiri sebelum memuat data | Tabel generik `/[section]` sebelumnya membaca Supabase tanpa pemeriksaan izin |

## Langkah berikutnya

Terapkan seluruh file dalam `supabase/migrations` secara berurutan melalui SQL Editor Supabase, termasuk `202609070007_period_activation.sql`. Langkah Foundation sudah tertutup: periode, anggota, divisi, jabatan, dan struktur kepengurusan semuanya terhubung ke Supabase. Berikutnya isi `role_permissions` untuk role selain Super Admin agar halaman organisasi terbuka bagi pengurus, rekam `attendance.view` dan `attendance.manage` sebagai migration karena keduanya baru ada di database dan belum di repo, lanjutkan ke Operations (program, tugas, agenda) dan dashboard yang membaca agregasi nyata, lalu siapkan pemetaan CSV ke anggota dan konfigurasi Google Drive.
