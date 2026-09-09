import assert from "node:assert/strict";
import test from "node:test";
import { permissionGroup, rootPermission } from "./permission-group.ts";

test("mengelompokkan permission dari awalan kuncinya", () => {
  assert.deepEqual(permissionGroup("member.update"), { prefix: "member", label: "Anggota" });
  assert.deepEqual(permissionGroup("attendance.view"), { prefix: "attendance", label: "Kehadiran" });
  assert.deepEqual(permissionGroup("system.manage"), { prefix: "system", label: "Sistem" });
});

test("kunci tanpa padanan label memakai awalannya apa adanya", () => {
  assert.deepEqual(permissionGroup("finance.approve"), { prefix: "finance", label: "finance" });
  assert.deepEqual(permissionGroup("tanpatitik"), { prefix: "tanpatitik", label: "tanpatitik" });
});

test("izin pengelola sistem dinamai satu tempat", () => {
  assert.equal(rootPermission, "system.manage");
});
