# Panduan Deploy

Target: Vercel (aplikasi) dan Supabase (database, autentikasi, penyimpanan
metadata). Berkas arsip disimpan di Google Drive organisasi.

---

## 1. Variabel lingkungan di Vercel

Isi seluruhnya pada Project Settings → Environment Variables, untuk environment
**Production** dan **Preview**.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | Alamat project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Kunci publik. Dipakai klien sesi dan proxy sehingga RLS tetap berlaku |
| `SUPABASE_SERVICE_ROLE_KEY` | ya | **Rahasia.** Hanya untuk operasi yang memang harus melewati RLS |
| `NEXT_PUBLIC_SITE_URL` | disarankan | Alamat produksi, misalnya `https://kse-unsrat.vercel.app`. Bila kosong, alamat diturunkan dari permintaan masuk |
| `GOOGLE_CLIENT_ID` | untuk Drive | OAuth client bertipe Desktop app |
| `GOOGLE_CLIENT_SECRET` | untuk Drive | **Rahasia** |
| `GOOGLE_REFRESH_TOKEN` | untuk Drive | Hasil `node scripts/google-drive-token.mjs` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | untuk Drive | Folder induk yang dibuat aplikasi, bukan dibuat manual |

Tanpa empat variabel Google, aplikasi tetap berjalan penuh; halaman Dokumen
menampilkan status "Belum tersambung" dan unggahan dinonaktifkan.

---

## 2. Supabase

**Migration.** Terapkan seluruh berkas dalam `supabase/migrations` secara
berurutan:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Bila skema sudah pernah dibuat manual, catat sebagai sudah diterapkan lebih
dulu dengan `npx supabase migration repair --status applied <versi>` agar tidak
dijalankan ulang di atas tabel yang sudah ada.

**Alamat pengalihan autentikasi.** Authentication → URL Configuration:

- Site URL: alamat produksi
- Redirect URLs: tambahkan `https://<domain>/auth/callback`

Tanpa ini, tautan reset password ditolak Supabase.

**Role dan permission.** Hanya Super Admin yang terisi otomatis. Peran lain
diberi izin lewat halaman Pengaturan setelah deploy.

---

## 3. Google Drive

Penyiapan lengkap ada di `README.md`. Yang khusus untuk produksi:

- Consent screen harus berstatus **In production**. Selama masih *Testing*,
  refresh token kedaluwarsa setiap tujuh hari dan integrasi Drive berhenti.
- Untuk mempublikasikan, Google meminta alamat beranda, kebijakan privasi, dan
  ketentuan penggunaan. Ketiganya sudah tersedia di `/`, `/privacy`, dan
  `/terms` setelah aplikasi tayang.

---

## 4. Sebelum dinyatakan siap

```bash
npm run lint              # pemeriksaan tipe
npm test                  # 40 uji fungsi murni
npm run test:integration  # 16 uji kontrak database
npm run test:e2e          # 30 uji browser terhadap build produksi
npm run build             # build produksi
```

Uji integrasi dan uji browser menyentuh database sungguhan. Keduanya membuat
data bertanda khusus lalu menghapusnya kembali, termasuk memulihkan periode
aktif. Jangan menjalankannya bersamaan dari dua tempat.

---

## 5. Setelah deploy

1. Masuk dengan akun Super Admin, buka setiap menu sekali.
2. Isi `role_permissions` untuk pengurus lain lewat halaman Pengaturan.
3. Tetapkan sedikitnya **dua** pemegang `system.manage`. Bila hanya satu dan
   akun itu hilang, pengaturan peran tidak dapat dipulihkan dari dalam aplikasi.
4. Unggah satu dokumen percobaan untuk memastikan Drive tersambung.

---

## 6. Rotasi kredensial

Kredensial yang pernah dibagikan lewat percakapan, tangkapan layar, atau berkas
harus diganti sebelum sistem dipakai sungguhan:

- Supabase: cabut access token, reset password database
- Google: hapus OAuth client lama, buat baru, ambil ulang refresh token

Anon key tidak rahasia dan tidak perlu dirotasi.
