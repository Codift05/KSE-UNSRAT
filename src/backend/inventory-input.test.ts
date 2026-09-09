import assert from "node:assert/strict";
import test from "node:test";
import { conditionValue, itemCode, itemName, itemStatusValue, loanStatusLabel, quantityValue, requireLoanDates, requireStockWithinTotal } from "./inventory-input.ts";

test("merapikan kode barang menjadi huruf besar bertanda hubung", () => {
  assert.equal(itemCode(" kse el 001 "), "KSE-EL-001");
  assert.equal(itemCode("kse-dk-004"), "KSE-DK-004");
  assert.throws(() => itemCode("AB"), /3–32 karakter/);
  assert.throws(() => itemCode("KSE_EL#1"), /huruf, angka, dan tanda hubung/);
});

test("membatasi nama dan jumlah barang", () => {
  assert.equal(itemName("  Kamera   Canon EOS "), "Kamera Canon EOS");
  assert.throws(() => itemName("Ka"), /3–100 karakter/);
  assert.equal(quantityValue("4", "Jumlah"), 4);
  assert.equal(quantityValue("0", "Jumlah"), 0);
  assert.throws(() => quantityValue("-1", "Jumlah"), /angka bulat/);
  assert.throws(() => quantityValue("2,5", "Jumlah"), /angka bulat/);
});

test("menolak status dan kondisi di luar skema", () => {
  assert.equal(itemStatusValue("under_repair"), "under_repair");
  assert.throws(() => itemStatusValue("hilang"), /Status barang tidak dikenali/);
  assert.equal(conditionValue("minor_damage"), "minor_damage");
  assert.throws(() => conditionValue("bagus"), /Kondisi barang tidak dikenali/);
});

test("jumlah tersedia tidak boleh melebihi total", () => {
  assert.deepEqual(requireStockWithinTotal(2, 3), { available: 2, total: 3 });
  assert.deepEqual(requireStockWithinTotal(3, 3), { available: 3, total: 3 });
  assert.throws(() => requireStockWithinTotal(4, 3), /melebihi jumlah total/);
});

test("rencana kembali tidak boleh mendahului tanggal pinjam", () => {
  assert.deepEqual(requireLoanDates("2026-09-10", "2026-09-14"), { borrowedOn: "2026-09-10", expectedReturnOn: "2026-09-14" });
  assert.throws(() => requireLoanDates("2026-09-14", "2026-09-10"), /sebelum tanggal pinjam/);
  assert.throws(() => requireLoanDates("", "2026-09-10"), /wajib diisi/);
});

test("memberi label status peminjaman", () => {
  assert.equal(loanStatusLabel("waiting_approval"), "Menunggu persetujuan");
  assert.equal(loanStatusLabel("condition_check"), "Cek kondisi");
  assert.equal(loanStatusLabel("entah"), "entah");
});
