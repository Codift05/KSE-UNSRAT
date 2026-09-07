# KSE Management System

Sebelum mengubah kode:

1. Baca `docs/PROJECT.md` untuk status, prioritas, dan keputusan aktif.
2. Baca bagian PRD yang berkaitan di `docs/PRD.md`.
3. Pertahankan pola visual dan komponen yang sudah ada.
4. Kerjakan satu vertical slice sampai berfungsi sebelum membuka modul berikutnya.
5. Jalankan `npm run lint` dan `npm run build` sebelum menyatakan selesai.

Tempatkan UI di `src/frontend`, akses data dan integrasi server di `src/backend`, serta route tipis di `src/app`.

Jangan memasukkan secret ke source code. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan pada server.
