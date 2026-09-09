import assert from "node:assert/strict";
import test from "node:test";
import { divisionName } from "./division-input.ts";

test("merapikan nama divisi dan menolak panjang di luar batas", () => {
  assert.equal(divisionName("  Community   Development "), "Community Development");
  assert.throws(() => divisionName("PR"), /3–60 karakter/);
  assert.throws(() => divisionName("x".repeat(61)), /3–60 karakter/);
});
