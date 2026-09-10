import { test, expect } from "@playwright/test";
import { createMemberAccount, MEMBER_EMAIL, MEMBER_PASSWORD, removeMemberAccount } from "./account.ts";

// Membuktikan pembatasan peran benar-benar terasa oleh pengguna, bukan hanya
// tercatat di database.
test.describe("pengalaman peran Anggota", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(createMemberAccount);
  test.afterAll(removeMemberAccount);

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(MEMBER_EMAIL);
    await page.getByLabel("Password").fill(MEMBER_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/");
  });

  test("menu yang tidak berizin disembunyikan dari navigasi", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    // Empat izin Anggota: member.view, program.view, document.upload, attendance.view.
    for (const menu of ["Dashboard", "Anggota", "Semua program", "Kehadiran & poin", "Dokumen"]) {
      await expect(nav.getByRole("link", { name: menu, exact: true })).toBeVisible();
    }
    for (const menu of ["Pengaturan", "Akun"]) {
      await expect(nav.getByRole("link", { name: menu, exact: true })).toHaveCount(0);
    }
  });

  test("halaman tertutup menolak dengan penjelasan, bukan layar galat", async ({ page }) => {
    for (const path of ["/settings", "/accounts"]) {
      await page.goto(path);
      await expect(page.getByText("Halaman ini belum dapat kamu buka")).toBeVisible();
      // Layar galat berarti aplikasi dianggap rusak, bukan sekadar terbatas.
      await expect(page.getByText("Halaman gagal dimuat")).toHaveCount(0);
    }
  });

  test("halaman yang berizin tetap terbuka penuh", async ({ page }) => {
    await page.goto("/members");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Anggota");
    await expect(page.getByText("Halaman ini belum dapat kamu buka")).toHaveCount(0);
  });

  test("kartu akun menampilkan peran yang sebenarnya", async ({ page }) => {
    await expect(page.getByText("Anggota Uji")).toBeVisible();
    await expect(page.locator(".user-card")).toContainText("Anggota");
  });
});
