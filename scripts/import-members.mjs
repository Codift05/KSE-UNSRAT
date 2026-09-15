// Mengimpor daftar beswan dari CSV ke Supabase.
//
//   node scripts/import-members.mjs <berkas.csv> [--commit]
//
// Tanpa --commit skrip hanya menampilkan rencana tanpa menyentuh basis data.
//
// Kolom yang dibaca: kse_id, nama, nim, fakultas, jurusan
// Gunakan --allow-similar bila dugaan duplikat memang orang yang berbeda.
// Baris dicocokkan dengan anggota yang sudah ada berdasarkan kse_id, lalu nim,
// lalu nama. Karena itu skrip aman dijalankan berulang: yang sudah ada
// diperbarui, bukan diduplikasi.
//
// Setiap beswan memerlukan akun Supabase karena profiles mengacu ke auth.users.
// Daftar dari KSE tidak memuat email, jadi email sementara dibentuk dari nomor
// peserta. Kata sandi awal ditulis ke berkas terpisah untuk dibagikan pengurus,
// tidak pernah ditampilkan di layar.

import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [, , csvPath, ...flags] = process.argv;
const commit = flags.includes("--commit");
if (!csvPath) {
  console.error("Pemakaian: node scripts/import-members.mjs <berkas.csv> [--commit]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Jalankan dengan: node --env-file=.env.local scripts/import-members.mjs ...");
  process.exit(1);
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const EMAIL_DOMAIN = "beswan.kseunsrat.web.id";

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

// Daftar dari KSE ditulis dengan huruf besar-kecil yang tidak seragam:
// "TEKNIK ELEKTRO", "ilmu Keperawatan", "Pendidikan dokter". Dirapikan agar
// tampil konsisten, sambil menjaga singkatan pendek seperti IBA tetap utuh.
function rapikan(teks) {
  return (teks || "").trim().split(/\s+/).map(kata => {
    const bersih = kata.replace(/[^A-Za-z]/g, "");
    if (bersih.length <= 4 && bersih === bersih.toUpperCase() && bersih.length > 1) return kata;
    return kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase();
  }).join(" ");
}

// Dua digit pertama NIM adalah tahun masuk universitas.
function angkatan(nim) {
  const m = /^(\d{2})/.exec((nim || "").trim());
  if (!m) return null;
  const tahun = 2000 + Number(m[1]);
  return tahun >= 2000 && tahun <= 2100 ? tahun : null;
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const header = rows[0].map(h => h.trim().toLowerCase());
const idx = name => header.indexOf(name);
const perlu = ["kse_id", "nama", "nim", "fakultas", "jurusan"];
const hilang = perlu.filter(k => idx(k) === -1);
if (hilang.length) {
  console.error(`Kolom wajib tidak ditemukan: ${hilang.join(", ")}`);
  console.error(`Kolom yang terbaca: ${header.join(", ")}`);
  process.exit(1);
}

const daftar = rows.slice(1).map(r => ({
  kse_id: (r[idx("kse_id")] || "").trim(),
  nama: (r[idx("nama")] || "").trim().replace(/\s+/g, " "),
  nim: (r[idx("nim")] || "").trim(),
  fakultas: rapikan(r[idx("fakultas")]),
  jurusan: rapikan(r[idx("jurusan")]),
})).filter(x => x.nama);

console.log(`Dibaca ${daftar.length} baris dari ${csvPath}`);

const [{ data: profiles }, { data: users }] = await Promise.all([
  db.from("profiles").select("id,full_name,kse_id,student_id"),
  db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
]);
const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const cocok = baris => (profiles || []).find(p =>
  (baris.kse_id && p.kse_id === baris.kse_id) ||
  (baris.nim && p.student_id === baris.nim) ||
  norm(p.full_name) === norm(baris.nama));

// Nama pada daftar resmi sering lebih panjang daripada yang diketik pengurus:
// "FITRA RANI SARI SARAGIH" versus "Fitra Saragih". Pencocokan persis tidak
// menangkapnya, dan hasilnya satu orang masuk dua kali. Kemiripan dua suku kata
// atau lebih diperlakukan sebagai dugaan duplikat dan diserahkan ke manusia.
const sukuKata = nama => new Set((nama || "").toLowerCase().split(/\s+/).map(k => k.replace(/[^a-z]/g, "")).filter(k => k.length >= 4));
function miripDengan(baris) {
  const kata = sukuKata(baris.nama);
  return (profiles || []).filter(p => {
    if (cocok(baris) === p) return false;
    const lain = sukuKata(p.full_name);
    return [...kata].filter(k => lain.has(k)).length >= 2;
  });
}

const izinkanMirip = flags.includes("--allow-similar");
const baru = [], diperbarui = [], mirip = [];
for (const baris of daftar) {
  if (cocok(baris)) { diperbarui.push(baris); continue; }
  const kandidat = miripDengan(baris);
  if (kandidat.length) mirip.push({ baris, kandidat });
  else baru.push(baris);
}

console.log(`  sudah ada, akan diperbarui : ${diperbarui.length}`);
console.log(`  belum ada, akan dibuat     : ${baru.length}`);
if (diperbarui.length) console.log(`  contoh kecocokan           : ${diperbarui.slice(0, 3).map(b => b.nama).join(", ")}`);

if (mirip.length) {
  console.log(`\n  DUGAAN DUPLIKAT (${mirip.length}) - tidak dibuat kecuali dipaksa:`);
  for (const { baris, kandidat } of mirip) {
    console.log(`    "${baris.nama}" menyerupai ${kandidat.map(k => `"${k.full_name}"`).join(", ")}`);
  }
  console.log("    Samakan namanya di basis data, atau jalankan dengan --allow-similar bila memang orang berbeda.");
  if (izinkanMirip) { baru.push(...mirip.map(m => m.baris)); console.log("    --allow-similar aktif: keduanya akan tetap dibuat."); }
}

if (!commit) {
  console.log("\nIni baru rencana. Jalankan ulang dengan --commit untuk menerapkannya.");
  process.exit(0);
}

const emailTerpakai = new Set((users?.users || []).map(u => (u.email || "").toLowerCase()));
const sandiBaru = [];
let dibuat = 0, disegarkan = 0, gagal = 0;

const dikerjakan = izinkanMirip ? daftar : daftar.filter(b => !mirip.some(m => m.baris === b));
for (const baris of dikerjakan) {
  const profilLama = cocok(baris);
  const isiProfil = {
    full_name: baris.nama,
    kse_id: baris.kse_id || null,
    student_id: baris.nim || null,
    faculty: baris.fakultas || null,
    study_program: baris.jurusan || null,
    cohort_year: angkatan(baris.nim),
    university: "Universitas Sam Ratulangi",
    member_status: "active",
    updated_at: new Date().toISOString(),
  };

  if (profilLama) {
    const { error } = await db.from("profiles").update(isiProfil).eq("id", profilLama.id);
    if (error) { console.error(`  GAGAL memperbarui ${baris.nama}: ${error.message}`); gagal += 1; }
    else disegarkan += 1;
    continue;
  }

  const email = `${baris.kse_id || norm(baris.nama)}@${EMAIL_DOMAIN}`;
  if (emailTerpakai.has(email)) { console.error(`  LEWAT ${baris.nama}: email ${email} sudah dipakai`); gagal += 1; continue; }
  const sandi = `Kse${randomBytes(6).toString("base64url")}!`;

  const { data, error } = await db.auth.admin.createUser({
    email, password: sandi, email_confirm: true, user_metadata: { full_name: baris.nama },
  });
  if (error || !data.user) { console.error(`  GAGAL membuat akun ${baris.nama}: ${error?.message}`); gagal += 1; continue; }

  const { error: profilError } = await db.from("profiles").update(isiProfil).eq("id", data.user.id);
  if (profilError) { console.error(`  GAGAL mengisi profil ${baris.nama}: ${profilError.message}`); gagal += 1; continue; }

  emailTerpakai.add(email);
  sandiBaru.push({ nama: baris.nama, email, sandi });
  dibuat += 1;
}

if (sandiBaru.length) {
  const out = "akun-baru.csv";
  writeFileSync(out, "nama,email,kata_sandi_awal\n" + sandiBaru.map(a => `"${a.nama}",${a.email},${a.sandi}`).join("\n") + "\n");
  console.log(`\nKata sandi awal ${sandiBaru.length} akun ditulis ke ${out}. Bagikan lalu hapus berkasnya.`);
}
console.log(`\nSelesai: ${dibuat} akun dibuat, ${disegarkan} profil diperbarui, ${gagal} gagal.`);
