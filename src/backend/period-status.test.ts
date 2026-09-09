import assert from "node:assert/strict";
import test from "node:test";
import { periodStatus, validatePeriodRange } from "./period-status.ts";

test("menentukan status periode dari flag aktif dan arsip", () => {
  assert.equal(periodStatus(true, null), "Aktif");
  assert.equal(periodStatus(true, "2026-09-07T00:00:00Z"), "Aktif");
  assert.equal(periodStatus(false, "2026-09-07T00:00:00Z"), "Diarsipkan");
  assert.equal(periodStatus(false, null), "Draft");
});

test("menolak rentang periode yang tidak masuk akal", () => {
  assert.deepEqual(validatePeriodRange("2026-2027", "2026-09-01", "2027-08-31"), { name: "2026-2027", startsOn: "2026-09-01", endsOn: "2027-08-31" });
  assert.throws(() => validatePeriodRange("26", "2026-09-01", "2027-08-31"), /4–40 karakter/);
  assert.throws(() => validatePeriodRange("2026-2027", "", "2027-08-31"), /wajib diisi/);
  assert.throws(() => validatePeriodRange("2026-2027", "bukan-tanggal", "2027-08-31"), /Format tanggal/);
  assert.throws(() => validatePeriodRange("2026-2027", "2027-08-31", "2026-09-01"), /lebih awal/);
  assert.throws(() => validatePeriodRange("2026-2027", "2026-09-01", "2026-09-01"), /lebih awal/);
});
