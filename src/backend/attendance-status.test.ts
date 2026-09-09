import assert from "node:assert/strict";
import test from "node:test";
import { attendanceStanding } from "./attendance-status.ts";

test("menghitung tingkat keaktifan dan batas SP", () => {
  assert.deepEqual(attendanceStanding(8, 0, 0, 2), { activity: "Sangat aktif", warning: "Aman" });
  assert.equal(attendanceStanding(3, 0, 0, 3).warning, "SP1");
  assert.equal(attendanceStanding(3, 0, 0, 6).warning, "SP2");
  assert.equal(attendanceStanding(3, 0, 0, 8).warning, "SP3");
  assert.equal(attendanceStanding(0, 0, 0, 0).activity, "Belum ada catatan");
});
