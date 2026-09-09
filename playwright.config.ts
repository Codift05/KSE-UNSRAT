import { defineConfig, devices } from "@playwright/test";

// Uji browser dijalankan terhadap build produksi, bukan dev server, agar yang
// diuji sama dengan yang benar-benar dikirim ke pengguna.
const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Berbagi satu database dengan aplikasi, jadi seperti integration test,
  // berkas tidak boleh berjalan bersamaan.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "id-ID",
    timezoneId: "Asia/Makassar",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/state.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
