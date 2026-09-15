import { test, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD, TEST_USERNAME } from "./account.ts";

// Anggota masuk dengan username; email internal dibentuk dari nomor peserta KSE
// dan tidak pernah dilihat siapa pun.
test.describe("masuk dengan username", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function coba(page: import("@playwright/test").Page, identitas: string, sandi: string) {
    await page.goto("/login");
    await page.getByLabel("Username").fill(identitas);
    await page.getByLabel("Password").fill(sandi);
    await page.getByRole("button", { name: "Masuk" }).click();
  }

  test("username yang benar membuka dashboard", async ({ page }) => {
    await coba(page, TEST_USERNAME, TEST_PASSWORD);
    await page.waitForURL("**/");
    await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  });

  test("alamat email tetap diterima bagi yang terbiasa", async ({ page }) => {
    await coba(page, TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL("**/");
    await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  });

  test("username asing dan sandi salah menghasilkan pesan yang sama", async ({ page }) => {
    // Bila pesannya berbeda, halaman ini dapat dipakai menebak siapa saja
    // anggotanya satu per satu.
    await coba(page, "tidakadaorangini", "SandiApaSaja123");
    const pesanAsing = await page.locator(".form-error").innerText();

    await coba(page, TEST_USERNAME, "SandiSalahSekali123");
    const pesanSalah = await page.locator(".form-error").innerText();

    expect(pesanAsing).toBe(pesanSalah);
    expect(pesanAsing).toContain("tidak valid");
  });

  test("username diperlakukan tanpa memandang huruf besar kecil", async ({ page }) => {
    await coba(page, TEST_USERNAME.toUpperCase(), TEST_PASSWORD);
    await page.waitForURL("**/");
    await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  });
});
