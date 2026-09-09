import { test, expect } from "@playwright/test";

// Dua bug nyata pernah lolos ke pengguna: <select> tanpa gaya sehingga formulir
// tampak seperti HTML mentah, dan <Link> memakai kelas tombol sehingga tampil
// sebagai tautan ungu bergaris bawah. Keduanya tidak terlihat oleh TypeScript
// maupun uji fungsi. Uji ini menjaga agar tidak kembali.

const halamanBerformulir = ["/divisions", "/management", "/programs", "/tasks", "/calendar", "/inventory", "/documents"];

for (const path of halamanBerformulir) {
  test(`kontrol formulir pada ${path} memakai gaya aplikasi`, async ({ page }) => {
    await page.goto(path);
    const selects = page.locator("form select");
    const jumlah = await selects.count();
    test.skip(jumlah === 0, "halaman ini tidak memuat select saat kosong");

    for (let index = 0; index < jumlah; index += 1) {
      const select = selects.nth(index);
      const gaya = await select.evaluate(element => {
        const computed = getComputedStyle(element);
        return {
          appearance: computed.appearance,
          borderWidth: computed.borderTopWidth,
          borderRadius: computed.borderTopLeftRadius,
          height: element.getBoundingClientRect().height,
        };
      });
      const nama = `${path} select ke-${index + 1}`;
      expect(gaya.appearance, `${nama} harus memakai panah kustom, bukan bawaan browser`).toBe("none");
      expect(parseFloat(gaya.borderWidth), `${nama} harus punya garis tepi`).toBeGreaterThan(0);
      expect(parseFloat(gaya.borderRadius), `${nama} harus punya sudut membulat`).toBeGreaterThan(0);
      expect(gaya.height, `${nama} harus setinggi kontrol lain`).toBeGreaterThanOrEqual(36);
    }
  });
}

test("tombol yang berupa tautan tidak tampil bergaris bawah", async ({ page }) => {
  await page.goto("/");
  const tombolTautan = page.locator("a.primary-button, a.period-button, a.danger-button");
  const jumlah = await tombolTautan.count();
  expect(jumlah, "dashboard memuat tombol berbentuk tautan").toBeGreaterThan(0);

  for (let index = 0; index < jumlah; index += 1) {
    const gaya = await tombolTautan.nth(index).evaluate(element => {
      const computed = getComputedStyle(element);
      return { decoration: computed.textDecorationLine, color: computed.color };
    });
    expect(gaya.decoration, "tombol tidak boleh bergaris bawah seperti tautan biasa").toBe("none");
  }
});

test("pemilih berkas dan tanggal ikut bergaya", async ({ page }) => {
  await page.goto("/calendar");
  const tanggal = page.locator('form input[type="datetime-local"]').first();
  if (await tanggal.count()) {
    const tinggi = await tanggal.evaluate(element => element.getBoundingClientRect().height);
    expect(tinggi, "pemilih waktu harus setinggi kontrol lain").toBeGreaterThanOrEqual(36);
  }

  await page.goto("/documents");
  const berkas = page.locator('form input[type="file"]').first();
  if (await berkas.count()) {
    const gaya = await berkas.evaluate(element => {
      const computed = getComputedStyle(element);
      return { borderWidth: computed.borderTopWidth, radius: computed.borderTopLeftRadius };
    });
    expect(parseFloat(gaya.borderWidth), "pemilih berkas harus punya garis tepi").toBeGreaterThan(0);
    expect(parseFloat(gaya.radius), "pemilih berkas harus punya sudut membulat").toBeGreaterThan(0);
  }
});

test("halaman tidak menggeser mendatar pada layar sempit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/members", "/settings"]) {
    await page.goto(path);
    const meluber = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(meluber, `${path} tidak boleh meluber ke samping pada layar 390px`).toBe(false);
  }
});
