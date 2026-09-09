import assert from "node:assert/strict";
import test from "node:test";
import { budgetValue, optionalDate, priorityValue, programName, programStatusValue, requireOrderedDates, taskStatusValue, taskTitle } from "./program-input.ts";

test("membatasi nama program dan judul tugas", () => {
  assert.equal(programName(" KSE   Mengajar "), "KSE Mengajar");
  assert.throws(() => programName("KS"), /3–100 karakter/);
  assert.equal(taskTitle("  Susun  daftar peserta "), "Susun daftar peserta");
  assert.throws(() => taskTitle("x".repeat(141)), /3–140 karakter/);
});

test("hanya menerima status dan prioritas yang dikenal skema", () => {
  assert.equal(programStatusValue("ongoing"), "ongoing");
  assert.throws(() => programStatusValue("jalan"), /Status program tidak dikenali/);
  assert.equal(taskStatusValue("done"), "done");
  assert.throws(() => taskStatusValue("selesai"), /Status tugas tidak dikenali/);
  assert.equal(priorityValue("urgent"), "urgent");
  assert.throws(() => priorityValue("penting"), /Prioritas tidak dikenali/);
});

test("tanggal opsional boleh kosong tetapi harus berformat benar", () => {
  assert.equal(optionalDate("", "Tanggal mulai"), null);
  assert.equal(optionalDate("2026-09-18", "Tanggal mulai"), "2026-09-18");
  assert.throws(() => optionalDate("18-09-2026", "Tanggal mulai"), /bukan tanggal yang valid/);
  assert.throws(() => optionalDate("2026-13-40", "Tanggal mulai"), /bukan tanggal yang valid/);
});

test("menolak rentang tanggal terbalik sebelum sampai ke Postgres", () => {
  assert.deepEqual(requireOrderedDates("2026-09-01", "2026-09-30", "tenggat"), { startsOn: "2026-09-01", endsOn: "2026-09-30" });
  assert.deepEqual(requireOrderedDates(null, "2026-09-30", "tenggat"), { startsOn: null, endsOn: "2026-09-30" });
  assert.throws(() => requireOrderedDates("2026-09-30", "2026-09-01", "tenggat"), /lebih awal dari tenggat/);
});

test("anggaran menerima pemisah ribuan dan menolak nilai tidak wajar", () => {
  assert.equal(budgetValue(""), 0);
  assert.equal(budgetValue("1.500.000"), 1500000);
  assert.throws(() => budgetValue("-5000"), /angka bulat tanpa tanda minus/);
  assert.throws(() => budgetValue("2,5"), /angka bulat tanpa tanda minus/);
});
