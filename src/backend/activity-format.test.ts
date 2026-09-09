import assert from "node:assert/strict";
import test from "node:test";
import { entityTypeLabel, humanizeAction } from "./activity-format.ts";

test("menerjemahkan jenis entitas dan membiarkan yang tak dikenal apa adanya", () => {
  assert.equal(entityTypeLabel("attendance"), "Kehadiran");
  assert.equal(entityTypeLabel("management"), "Kepengurusan");
  assert.equal(entityTypeLabel("sesuatu"), "sesuatu");
});

test("menerjemahkan enum mentah di ujung kalimat aksi", () => {
  assert.equal(humanizeAction("Mencatat kehadiran: present"), "Mencatat kehadiran: Hadir");
  assert.equal(humanizeAction("Mengubah status program menjadi ongoing"), "Mengubah status program menjadi Berjalan");
  assert.equal(humanizeAction("Mengubah status tugas menjadi in_progress"), "Mengubah status tugas menjadi Dikerjakan");
});

test("membiarkan kalimat yang tidak berakhiran enum", () => {
  assert.equal(humanizeAction("Membuat periode 2026-2027"), "Membuat periode 2026-2027");
  assert.equal(humanizeAction("Menghapus akun permanen"), "Menghapus akun permanen");
  assert.equal(humanizeAction("Mencatat kehadiran: zzz"), "Mencatat kehadiran: zzz");
});
