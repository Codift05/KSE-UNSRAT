import assert from "node:assert/strict";
import test from "node:test";
import { agendaTypeValue, attendanceEventType, eventTitle, eventTypeLabel, requireOrderedMoments } from "./event-input.ts";

test("hanya menerima jenis agenda yang dapat dibuat dari kalender", () => {
  assert.equal(agendaTypeValue("meeting"), "meeting");
  assert.equal(agendaTypeValue("deadline"), "deadline");
  // Kegiatan kehadiran dikelola modul Kehadiran, bukan kalender.
  assert.throws(() => agendaTypeValue(attendanceEventType), /Jenis agenda tidak dikenali/);
  assert.throws(() => agendaTypeValue("rapat"), /Jenis agenda tidak dikenali/);
});

test("memberi label jenis kegiatan termasuk milik modul kehadiran", () => {
  assert.equal(eventTypeLabel("meeting"), "Rapat");
  assert.equal(eventTypeLabel("attendance"), "Kehadiran");
  assert.equal(eventTypeLabel("lainnya"), "lainnya");
});

test("membatasi judul agenda", () => {
  assert.equal(eventTitle("  Rapat   Pengurus "), "Rapat Pengurus");
  assert.throws(() => eventTitle("Ra"), /3–120 karakter/);
});

test("waktu selesai harus setelah waktu mulai", () => {
  const start = "2026-09-18T01:00:00.000Z";
  assert.deepEqual(requireOrderedMoments(start, null), { startsAt: start, endsAt: null });
  assert.throws(() => requireOrderedMoments(start, "2026-09-18T00:00:00.000Z"), /setelah waktu mulai/);
  assert.throws(() => requireOrderedMoments(start, start), /setelah waktu mulai/);
});
