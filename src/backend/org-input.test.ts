import assert from "node:assert/strict";
import test from "node:test";
import { divisionName, positionName, sortOrder } from "./org-input.ts";

test("merapikan nama divisi dan menolak panjang di luar batas", () => {
  assert.equal(divisionName("  Community   Development "), "Community Development");
  assert.throws(() => divisionName("PR"), /Nama divisi harus 3–60 karakter/);
  assert.throws(() => divisionName("x".repeat(61)), /Nama divisi harus 3–60 karakter/);
});

test("merapikan nama jabatan dengan pesan yang sesuai", () => {
  assert.equal(positionName(" Wakil   Ketua "), "Wakil Ketua");
  assert.throws(() => positionName("Ke"), /Nama jabatan harus 3–60 karakter/);
});

test("urutan jabatan kosong menjadi nol dan menolak bukan angka", () => {
  assert.equal(sortOrder(""), 0);
  assert.equal(sortOrder(" 12 "), 12);
  assert.throws(() => sortOrder("-1"), /angka 0–999/);
  assert.throws(() => sortOrder("1000"), /angka 0–999/);
});
