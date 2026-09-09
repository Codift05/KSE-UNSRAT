import assert from "node:assert/strict";
import test from "node:test";
import { greetingForHour, initialsOf, isoToOrganizationDateTime, organizationDateTimeToIso, relativeTimeLabel } from "./time-format.ts";

test("memilih sapaan sesuai jam WITA", () => {
  assert.equal(greetingForHour(0), "Selamat malam");
  assert.equal(greetingForHour(5), "Selamat pagi");
  assert.equal(greetingForHour(11), "Selamat siang");
  assert.equal(greetingForHour(15), "Selamat sore");
  assert.equal(greetingForHour(19), "Selamat malam");
});

test("menyusun label waktu relatif", () => {
  const now = new Date("2026-09-09T12:00:00Z");
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();
  assert.equal(relativeTimeLabel(ago(30), now), "Baru saja");
  assert.equal(relativeTimeLabel(ago(600), now), "10 menit lalu");
  assert.equal(relativeTimeLabel(ago(7200), now), "2 jam lalu");
  assert.equal(relativeTimeLabel(ago(172800), now), "2 hari lalu");
  assert.match(relativeTimeLabel(ago(2592000), now), /Agu 2026/);
});

test("mengambil inisial dari nama", () => {
  assert.equal(initialsOf("Miftahuddin S. Arsyad"), "MS");
  assert.equal(initialsOf("Ezra"), "E");
  assert.equal(initialsOf("  vinny   moningka "), "VM");
  assert.equal(initialsOf(""), "?");
});

test("membaca input datetime-local sebagai waktu WITA", () => {
  // 09.00 WITA sama dengan 01.00 UTC.
  assert.equal(organizationDateTimeToIso("2026-09-18T09:00"), "2026-09-18T01:00:00.000Z");
  assert.equal(organizationDateTimeToIso("2026-01-01T00:30"), "2025-12-31T16:30:00.000Z");
  assert.throws(() => organizationDateTimeToIso("2026-09-18"), /tidak valid/);
  assert.throws(() => organizationDateTimeToIso("18-09-2026T09:00"), /tidak valid/);
});

test("mengembalikan ISO ke input datetime-local WITA tanpa bergeser", () => {
  assert.equal(isoToOrganizationDateTime("2026-09-18T01:00:00.000Z"), "2026-09-18T09:00");
  assert.equal(isoToOrganizationDateTime("2025-12-31T16:30:00.000Z"), "2026-01-01T00:30");
  const roundTrip = "2026-03-05T14:45";
  assert.equal(isoToOrganizationDateTime(organizationDateTimeToIso(roundTrip)), roundTrip);
});
