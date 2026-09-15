import { test, expect } from "@playwright/test";
import { adminClient, TEST_NAME } from "./account.ts";

// Catatan lama gagal karena saldo diketik manual: satu salah ketik pada
// 7 September 2025 membuat seluruh saldo setahun berikutnya meleset Rp410.000.
// Uji ini membuktikan saldo di sistem selalu dihitung ulang dari transaksinya.
const JEJAK = `UjiKas-${Date.now().toString(36)}`;

async function bersihkan() {
  const db = adminClient();
  const { data } = await db.from("finance_transactions").select("id").like("description", "UjiKas-%");
  for (const row of data || []) {
    await db.from("member_dues").delete().eq("transaction_id", row.id);
    await db.from("finance_transactions").delete().eq("id", row.id);
  }
  await db.from("member_dues").delete().like("note", "UjiKas-%");
}

test.beforeAll(bersihkan);
test.afterAll(bersihkan);

function angka(teks: string) {
  return Number(teks.replace(/[^\d-]/g, ""));
}

test("saldo dihitung ulang dari transaksi, bukan diketik", async ({ page }) => {
  await page.goto("/finance");
  const saldo = () => page.locator(".module-stats article", { hasText: "Saldo kas" }).locator("strong");
  const form = page.locator('form:has(button:has-text("Catat"))').first();
  const awal = angka(await saldo().innerText());

  // Kas masuk menambah saldo.
  await form.locator('select[name="direction"]').selectOption("in");
  await form.locator('input[name="occurred_on"]').fill("2026-09-15");
  await form.locator('input[name="amount"]').fill("1.500.000");
  await form.locator('input[name="description"]').fill(`${JEJAK} dana masuk`);
  await form.getByRole("button", { name: "Catat", exact: true }).click();
  await expect(page.getByText("Transaksi tercatat.")).toBeVisible();
  await expect.poll(async () => angka(await saldo().innerText())).toBe(awal + 1500000);

  // Kas keluar menguranginya. Nominal ditulis dengan pemisah berbeda untuk
  // sekaligus menguji penguraian rupiah yang memaafkan.
  await form.locator('select[name="direction"]').selectOption("out");
  await form.locator('input[name="occurred_on"]').fill("2026-09-15");
  await form.locator('input[name="amount"]').fill("Rp250,000");
  await form.locator('input[name="description"]').fill(`${JEJAK} beli perlengkapan`);
  await form.getByRole("button", { name: "Catat", exact: true }).click();
  await expect.poll(async () => angka(await saldo().innerText())).toBe(awal + 1250000);

  // Dihitung, bukan sekadar dicari: dua baris untuk satu penyimpanan berarti
  // transaksi terduplikasi, dan itu kesalahan yang harus menggagalkan uji.
  await expect(page.getByRole("cell", { name: `${JEJAK} dana masuk`, exact: true })).toHaveCount(1);
  await expect(page.getByRole("cell", { name: `${JEJAK} beli perlengkapan`, exact: true })).toHaveCount(1);
});

test("iuran tercatat atas nama anggota, bukan sekadar jumlah kepala", async ({ page }) => {
  const db = adminClient();
  const { data: period } = await db.from("periods").select("id,dues_target").eq("is_active", true).single();
  const targetAwal = Number(period!.dues_target);
  if (!targetAwal) await db.from("periods").update({ dues_target: 240000 }).eq("id", period!.id);

  await page.goto("/finance");
  const form = page.locator('form:has(button:has-text("Catat iuran"))');
  await form.locator('select[name="member_ids"]').selectOption({ label: TEST_NAME });
  await form.locator('input[name="amount"]').fill("240000");
  await form.locator('input[name="paid_on"]').fill("2026-09-15");
  await form.locator('input[name="note"]').fill(`${JEJAK} pembayaran`);
  await form.getByRole("button", { name: "Catat iuran" }).click();
  await expect(page.getByText(/Iuran 1 anggota tercatat/)).toBeVisible();

  // Inilah yang tidak dapat dijawab catatan lama: siapa yang sudah membayar.
  const baris = page.getByRole("row", { name: new RegExp(TEST_NAME) }).last();
  await expect(baris).toContainText("Lunas");

  if (!targetAwal) await db.from("periods").update({ dues_target: 0 }).eq("id", period!.id);
});

test("nominal yang bukan angka ditolak dengan penjelasan", async ({ page }) => {
  await page.goto("/finance");
  const form = page.locator('form:has(button:has-text("Catat"))').first();
  await form.locator('input[name="occurred_on"]').fill("2026-09-15");
  await form.locator('input[name="amount"]').fill("seratus ribu");
  await form.locator('input[name="description"]').fill(`${JEJAK} salah ketik`);
  await form.getByRole("button", { name: "Catat", exact: true }).click();
  await expect(page.locator(".inline-message.error")).toContainText("hanya boleh berisi angka");
});
