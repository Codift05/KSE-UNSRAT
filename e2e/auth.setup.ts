import { test as setup, expect } from "@playwright/test";
import { createTestAccount, TEST_EMAIL, TEST_PASSWORD } from "./account.ts";

setup("membuat akun uji dan menyimpan sesi login", async ({ page }) => {
  await createTestAccount();

  await page.goto("/login");
  // Field bernama "Username" tetapi menerima email apa adanya bila tidak ada
  // pemetaan alias untuknya.
  await page.getByLabel("Username").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();

  await page.waitForURL("**/", { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/state.json" });
});
