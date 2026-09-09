import assert from "node:assert/strict";
import test from "node:test";
import { memberName, memberStatusValue, memberYear, optionalText } from "./member-profile.ts";

test("membersihkan nama anggota dan menolak panjang di luar batas", () => {
  assert.equal(memberName("  Fitra Maulana  "), "Fitra Maulana");
  assert.throws(() => memberName("A"), /2–100 karakter/);
  assert.throws(() => memberName("x".repeat(101)), /2–100 karakter/);
});

test("menerima tahun kosong tetapi menolak tahun yang tidak masuk akal", () => {
  assert.equal(memberYear("", "Angkatan"), null);
  assert.equal(memberYear(" 2022 ", "Angkatan"), 2022);
  assert.throws(() => memberYear("22", "Angkatan"), /4 digit tahun/);
  assert.throws(() => memberYear("dua ribu", "Angkatan"), /4 digit tahun/);
  assert.throws(() => memberYear("1899", "Angkatan"), /antara 1990 dan 2100/);
});

test("hanya menerima status anggota yang dikenal skema", () => {
  assert.equal(memberStatusValue("transferred"), "transferred");
  assert.throws(() => memberStatusValue("keluar"), /tidak dikenali/);
});

test("mengubah isian opsional kosong menjadi null", () => {
  assert.equal(optionalText("   "), null);
  assert.equal(optionalText(" Teknik Informatika "), "Teknik Informatika");
  assert.throws(() => optionalText("x".repeat(121)), /melebihi 120 karakter/);
});
