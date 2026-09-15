import assert from "node:assert/strict";
import test from "node:test";
import { directionValue, duesStatus, financeDate, financeDescription, maxAmount, runningBalance, rupiah } from "./finance-input.ts";

test("menguraikan rupiah dari berbagai kebiasaan penulisan", () => {
  assert.equal(rupiah("Rp1.500.000"), 1500000);
  assert.equal(rupiah("1,500,000"), 1500000);
  assert.equal(rupiah("1500000"), 1500000);
  assert.equal(rupiah("Rp 240 000"), 240000);
});

test("menolak nominal yang tidak masuk akal", () => {
  assert.throws(() => rupiah(""), /wajib diisi/);
  assert.throws(() => rupiah("seratus ribu"), /hanya boleh berisi angka/);
  assert.throws(() => rupiah("0"), /lebih dari nol/);
  assert.throws(() => rupiah(String(maxAmount + 1)), /batas wajar/);
});

test("arah transaksi hanya masuk atau keluar", () => {
  assert.equal(directionValue("in"), "in");
  assert.equal(directionValue("out"), "out");
  assert.throws(() => directionValue("masuk"), /tidak dikenali/);
  assert.throws(() => directionValue(""), /tidak dikenali/);
});

test("tanggal transaksi wajib dan berformat benar", () => {
  assert.equal(financeDate("2026-09-15"), "2026-09-15");
  assert.throws(() => financeDate(""), /wajib diisi/);
  assert.throws(() => financeDate("15-09-2026"), /bukan tanggal yang valid/);
});

test("uraian dirapikan dan dibatasi panjangnya", () => {
  assert.equal(financeDescription("  Bayar   listrik "), "Bayar listrik");
  assert.throws(() => financeDescription("ab"), /3–140 karakter/);
});

test("saldo dihitung dari transaksi, bukan disimpan", () => {
  // Meniru awal catatan lama: dana awal, lalu tiga pengeluaran berturut-turut.
  const entries = [
    { direction: "in", amount: 3261507 },
    { direction: "out", amount: 293500 },
    { direction: "out", amount: 471663 },
    { direction: "out", amount: 1125000 },
  ];
  assert.equal(runningBalance(entries), 1371344);
  assert.equal(runningBalance([]), 0);
});

test("status iuran menjelaskan sisa tunggakan", () => {
  assert.deepEqual(duesStatus(240000, 240000), { label: "Lunas", outstanding: 0, settled: true });
  assert.deepEqual(duesStatus(0, 240000), { label: "Belum bayar", outstanding: 240000, settled: false });
  assert.deepEqual(duesStatus(100000, 240000), { label: "Kurang", outstanding: 140000, settled: false });
  // Kelebihan bayar tidak menghasilkan tunggakan negatif.
  assert.deepEqual(duesStatus(300000, 240000), { label: "Lunas", outstanding: 0, settled: true });
  assert.equal(duesStatus(0, 0).label, "Belum ada target");
});
