import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { anyProfileId, beginSuite, createTestPeriod, db, endSuite } from "./helpers.ts";

before(beginSuite);
after(endSuite);

test("menghapus program ikut menghapus tugas di dalamnya", async () => {
  const period = await createTestPeriod("program-cascade");
  const { data: program } = await db.from("programs").insert({ period_id: period.id, name: "Program Uji" }).select("id").single();
  const { data: task, error } = await db.from("tasks").insert({ program_id: program!.id, title: "Tugas Uji" }).select("id").single();
  assert.equal(error, null, String(error?.message));

  await db.from("programs").delete().eq("id", program!.id);
  const { count } = await db.from("tasks").select("*", { count: "exact", head: true }).eq("id", task!.id);
  assert.equal(count, 0, "tugas harus ikut terhapus mengikuti on delete cascade");
});

test("progress program dihitung dari rasio tugas selesai", async () => {
  const period = await createTestPeriod("progress");
  const { data: program } = await db.from("programs").insert({ period_id: period.id, name: "Program Progress" }).select("id").single();
  await db.from("tasks").insert([
    { program_id: program!.id, title: "Tugas 1", status: "done" },
    { program_id: program!.id, title: "Tugas 2", status: "done" },
    { program_id: program!.id, title: "Tugas 3", status: "todo" },
    { program_id: program!.id, title: "Tugas 4", status: "in_progress" },
  ]);

  // Perhitungan yang sama dipakai halaman Program dan panel dashboard.
  const { data: tasks } = await db.from("tasks").select("status").eq("program_id", program!.id);
  const done = (tasks || []).filter(task => task.status === "done").length;
  assert.equal(tasks?.length, 4);
  assert.equal(Math.round((done / tasks!.length) * 100), 50, "dua dari empat tugas selesai berarti progress 50 persen");
});

test("menghapus divisi melepas anggotanya tanpa menghapus profilnya", async () => {
  const period = await createTestPeriod("divisi-lepas");
  const memberId = await anyProfileId();
  const { data: division } = await db.from("divisions").insert({ period_id: period.id, name: "Divisi Lepas" }).select("id").single();
  await db.from("division_members").insert({ division_id: division!.id, member_id: memberId });

  await db.from("divisions").delete().eq("id", division!.id);
  const { count: assignments } = await db.from("division_members").select("*", { count: "exact", head: true }).eq("member_id", memberId).eq("division_id", division!.id);
  const { count: profiles } = await db.from("profiles").select("*", { count: "exact", head: true }).eq("id", memberId);
  assert.equal(assignments, 0, "penugasan divisi harus ikut terhapus");
  assert.equal(profiles, 1, "profil anggota tidak boleh ikut terhapus");
});

test("poin kehadiran mengikuti konfigurasi kegiatan dan status verifikasi", async () => {
  const period = await createTestPeriod("poin");
  const memberId = await anyProfileId();
  const { data: event, error: eventError } = await db.from("events").insert({
    period_id: period.id, title: "Kegiatan Poin", type: "attendance", starts_at: "2000-01-01T01:00:00Z",
    attendance_mode: "offline", present_points: 20, late_points: 20, partial_points: 10, permission_points: 0, absent_points: -10,
  }).select("id").single();
  assert.equal(eventError, null, String(eventError?.message));

  const { data: record, error } = await db.from("attendance_records").insert({
    event_id: event!.id, member_id: memberId, status: "present", points_awarded: 0, verification_status: "verified",
  }).select("points_awarded").single();
  assert.equal(error, null, String(error?.message));
  assert.equal(Number(record!.points_awarded), 20, "hadir penuh pada kegiatan luring bernilai 20 poin");

  await db.from("attendance_records").update({ status: "partial" }).eq("event_id", event!.id).eq("member_id", memberId);
  const { data: partial } = await db.from("attendance_records").select("points_awarded").eq("event_id", event!.id).single();
  assert.equal(Number(partial!.points_awarded), 10, "hadir sebagian bernilai setengah");

  await db.from("attendance_records").update({ status: "absent" }).eq("event_id", event!.id).eq("member_id", memberId);
  const { data: absent } = await db.from("attendance_records").select("points_awarded").eq("event_id", event!.id).single();
  assert.equal(Number(absent!.points_awarded), -10, "alpa mengurangi poin");
});

test("absensi yang belum diverifikasi tidak memberi poin", async () => {
  const period = await createTestPeriod("belum-verifikasi");
  const memberId = await anyProfileId();
  const { data: event } = await db.from("events").insert({
    period_id: period.id, title: "Kegiatan Mandiri", type: "attendance", starts_at: "2000-01-01T01:00:00Z",
    attendance_mode: "offline", present_points: 20, late_points: 20, partial_points: 10, permission_points: 0, absent_points: -10,
  }).select("id").single();

  // Keputusan aktif: absensi mandiri selalu menunggu verifikasi sebelum berpoin.
  const { data: pending } = await db.from("attendance_records").insert({
    event_id: event!.id, member_id: memberId, status: "present", points_awarded: 99, source: "self", verification_status: "pending",
  }).select("points_awarded").single();
  assert.equal(Number(pending!.points_awarded), 0, "poin harus nol selama belum diverifikasi");

  await db.from("attendance_records").update({ verification_status: "verified" }).eq("event_id", event!.id).eq("member_id", memberId);
  const { data: verified } = await db.from("attendance_records").select("points_awarded").eq("event_id", event!.id).single();
  assert.equal(Number(verified!.points_awarded), 20, "poin diberikan setelah pengurus memverifikasi");
});

test("dokumen wajib menunjuk berkas atau folder Drive", async () => {
  const period = await createTestPeriod("dokumen");
  // Constraint documents_drive_target mencegah metadata tanpa arsip di Drive.
  const { error } = await db.from("documents").insert({ period_id: period.id, title: "Dokumen Tanpa Drive" });
  assert.notEqual(error, null, "dokumen tanpa drive_file_id maupun drive_folder_id harus ditolak");
  assert.match(`${error?.message} ${error?.code}`, /23514|documents_drive_target|check/i);
});

test("satu anggota tidak dapat memegang dua baris divisi yang sama", async () => {
  const period = await createTestPeriod("divisi-ganda");
  const memberId = await anyProfileId();
  const { data: division } = await db.from("divisions").insert({ period_id: period.id, name: "Divisi Ganda" }).select("id").single();
  await db.from("division_members").insert({ division_id: division!.id, member_id: memberId });

  const { error } = await db.from("division_members").insert({ division_id: division!.id, member_id: memberId });
  assert.notEqual(error, null, "primary key gabungan harus menolak duplikat");
});
