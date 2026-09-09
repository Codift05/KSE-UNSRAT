import { test, expect, type Page } from "@playwright/test";

// Setiap halaman aplikasi. Uji ini menangkap galat runtime dan halaman yang
// gagal dirender - kelas kesalahan yang tidak terlihat oleh TypeScript maupun
// uji fungsi murni.
const pages: [string, string][] = [
  ["/", "Selamat"],
  ["/members", "Anggota"],
  ["/periods", "Periode"],
  ["/divisions", "Divisi"],
  ["/management", "Kepengurusan"],
  ["/programs", "Semua program"],
  ["/tasks", "Tugas"],
  ["/calendar", "Kalender"],
  ["/inventory", "Inventaris"],
  ["/documents", "Dokumen"],
  ["/activity", "Log aktivitas"],
  ["/settings", "Pengaturan"],
  ["/accounts", "Akun beswan"],
  ["/attendance", "Kehadiran"],
  ["/profile", "Profil"],
];

function collectProblems(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", error => problems.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() !== "error") return;
    const text = message.text();
    // Galat pemuatan sumber daya pihak ketiga bukan urusan uji ini.
    if (/favicon|net::ERR_/i.test(text)) return;
    problems.push(`console: ${text}`);
  });
  return problems;
}

for (const [path, heading] of pages) {
  test(`halaman ${path} dirender tanpa galat`, async ({ page }) => {
    const problems = collectProblems(page);
    const response = await page.goto(path);

    expect(response?.status(), `${path} harus merespons 200`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    // Sidebar wajib ada di setiap halaman; ketiadaannya berarti kerangka gagal.
    await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
    expect(problems, `galat pada ${path}:\n${problems.join("\n")}`).toEqual([]);
  });
}

test("halaman yang tidak ada menampilkan pesan khusus, bukan galat mentah", async ({ page }) => {
  await page.goto("/halaman-yang-tidak-pernah-ada");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("tidak ditemukan");
});

test("dokumen legal terbuka tanpa sesi", async ({ browser }) => {
  const anonim = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await anonim.newPage();
  for (const path of ["/privacy", "/terms"]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} harus dapat dibuka tanpa login`).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await anonim.close();
});
