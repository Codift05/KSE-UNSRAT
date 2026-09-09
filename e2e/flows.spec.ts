import { test, expect } from "@playwright/test";
import { adminClient } from "./account.ts";

// Alur lintas modul: inilah yang tidak dapat diuji per halaman. Progress program
// berasal dari tugas, dan stok inventaris berasal dari trigger database, jadi
// keduanya hanya terbukti benar bila dijalankan dari ujung ke ujung.
// Nama dibuat unik setiap jalannya agar sisa data dari percobaan yang gagal
// tidak menghasilkan baris ganda dan membingungkan selector.
const TANDA = "UjiAlur";
const JEJAK = `${TANDA}-${Date.now().toString(36)}`;

async function bersihkan() {
    const db = adminClient();
  await db.from("inventory_transactions").delete().like("purpose", `${TANDA}%`);
  await db.from("inventory_items").delete().like("code", "UJI-ALUR%");
  const { data: programs } = await db.from("programs").select("id").like("name", `${TANDA}%`);
  for (const program of programs || []) await db.from("programs").delete().eq("id", program.id);
  await db.from("divisions").delete().like("name", `${TANDA}%`);
}

test.beforeAll(bersihkan);
test.afterAll(bersihkan);

test("program yang tugasnya selesai menaikkan progress di halaman Program dan dashboard", async ({ page }) => {
  const namaProgram = `${JEJAK} Program`;

  await page.goto("/programs");
  await page.locator('input[name="name"]').first().fill(namaProgram);
  await page.getByRole("button", { name: "Buat program" }).click();
  await expect(page.getByRole("cell", { name: namaProgram }).first()).toBeVisible();
  // Tanpa tugas, progress harus nol dan bukan seratus.
  await expect(page.getByRole("row", { name: new RegExp(namaProgram) }).first()).toContainText("0%");

  await page.goto("/tasks");
  for (const [judul, status] of [["Tugas selesai", "Selesai"], ["Tugas berjalan", "Belum mulai"]] as const) {
    await page.locator('input[name="title"]').first().fill(`${JEJAK} ${judul}`);
    await page.locator('select[name="program_id"]').selectOption({ label: namaProgram });
    await page.locator('select[name="status"]').selectOption({ label: status });
    await page.getByRole("button", { name: "Tambah tugas" }).click();
    await expect(page.getByRole("cell", { name: `${JEJAK} ${judul}` }).first()).toBeVisible();
  }

  // Satu dari dua tugas selesai berarti setengah jalan.
  await page.goto("/programs");
  await expect(page.getByRole("row", { name: new RegExp(namaProgram) }).first()).toContainText("50%");

  await page.goto("/");
  await expect(page.getByText(namaProgram).first()).toBeVisible();
  await expect(page.locator(".program-row", { hasText: namaProgram }).first()).toContainText("50%");
});

test("menyerahkan barang mengurangi stok dan mengembalikannya memulihkan", async ({ page }) => {
  const kode = `UJI-ALUR-${Date.now().toString(36).slice(-5)}`.toUpperCase();
  const nama = `${JEJAK} Kamera`;

  await page.goto("/inventory");
  // Kedua formulir memakai name="quantity", jadi selector harus dibatasi pada
  // formulirnya masing-masing, bukan mengandalkan urutan kemunculan.
  const formBarang = page.locator('form:has(button:has-text("Tambah barang"))');
  const formPinjam = page.locator('form:has(button:has-text("Ajukan"))');
  const barisBarang = () => page.getByRole("row", { name: new RegExp(kode) }).first();

  await formBarang.locator('input[name="code"]').fill(kode);
  await formBarang.locator('input[name="name"]').fill(nama);
  await formBarang.locator('input[name="quantity"]').fill("3");
  await formBarang.locator('input[name="available_quantity"]').fill("3");
  await formBarang.getByRole("button", { name: "Tambah barang" }).click();
  await expect(barisBarang()).toContainText("3 dari 3");

  await formPinjam.locator('select[name="item_id"]').selectOption({ label: `${nama} · tersedia 3` });
  await formPinjam.locator('input[name="quantity"]').fill("2");
  await formPinjam.locator('input[name="borrowed_on"]').fill("2026-09-10");
  await formPinjam.locator('input[name="expected_return_on"]').fill("2026-09-14");
  await formPinjam.locator('input[name="purpose"]').fill(`${JEJAK} dokumentasi`);
  await formPinjam.getByRole("button", { name: "Ajukan" }).click();

  // Pengajuan belum boleh memotong stok; pemotongan terjadi saat diserahkan.
  await expect(page.getByText("Pengajuan peminjaman terkirim")).toBeVisible();
  await expect(barisBarang()).toContainText("3 dari 3");

  await page.getByRole("button", { name: "Setujui" }).first().click();
  await page.getByRole("button", { name: "Serahkan" }).first().click();
  await expect(barisBarang()).toContainText("1 dari 3");

  await page.getByRole("button", { name: "Terima kembali" }).first().click();
  await expect(barisBarang()).toContainText("3 dari 3");
});

test("membuat divisi lalu menetapkannya ke anggota terlihat di halaman Anggota", async ({ page }) => {
  const namaDivisi = `${JEJAK} Divisi`;

  await page.goto("/divisions");
  await page.locator('input[name="name"]').first().fill(namaDivisi);
  await page.getByRole("button", { name: "Tambah divisi" }).click();
  await expect(page.getByRole("cell", { name: namaDivisi }).first()).toBeVisible();

  await page.goto("/members");
  await page.getByRole("button", { name: /Atur divisi/ }).first().click();
  await page.locator('select[name="division_id"]').selectOption({ label: namaDivisi });
  await page.getByRole("button", { name: "Simpan divisi" }).click();
  await expect(page.getByText("Divisi anggota diperbarui.")).toBeVisible();

  await page.getByRole("button", { name: "Tutup" }).click();
  await expect(page.getByRole("row", { name: /Akun Uji Otomatis/ })).toContainText(namaDivisi);
});
