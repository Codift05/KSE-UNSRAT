"use server";

import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { distanceMeters, validCoordinates } from "@/backend/attendance-location";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { organizationDateTimeToIso } from "@/backend/time-format";

const number = (value: FormDataEntryValue | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Nilai poin tidak valid");
  return parsed;
};

export type AttendanceActionState = { message?: string; error?: string; link?: string; code?: string };

const hash = (value: string) => createHash("sha256").update(value).digest();
const sameHash = (value: string, expected: string) => { const actual = hash(value); const stored = Buffer.from(expected, "hex"); return actual.length === stored.length && timingSafeEqual(actual, stored); };
const value = (form: FormData, key: string) => Number(form.get(key));

async function currentUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) throw new Error("Sesi tidak valid");
  return data.claims.sub;
}

export async function createAttendanceEvent(_: AttendanceActionState, form: FormData): Promise<AttendanceActionState> {
  try {
    const user = await requirePermission("attendance.manage");
    const title = String(form.get("title") || "").trim();
    const startsAt = String(form.get("starts_at") || "");
    const mode = String(form.get("attendance_mode") || "");
    if (!title || !startsAt || !["offline", "online"].includes(mode)) throw new Error("Data kegiatan belum lengkap");
    const fullPoints = mode === "offline" ? 20 : 10;

    const { data: period } = await supabaseAdmin.from("periods").select("id").eq("is_active", true).single();
    if (!period) throw new Error("Periode aktif belum tersedia");
    const { data: event, error } = await supabaseAdmin.from("events").insert({
      period_id: period.id, title, type: "attendance", starts_at: organizationDateTimeToIso(startsAt), created_by: user.id,
      attendance_mode: mode, present_points: fullPoints, late_points: fullPoints, partial_points: fullPoints / 2, permission_points: 0, absent_points: number(form.get("absent_points")),
    }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: "Membuat kegiatan kehadiran", entity_type: "event", entity_id: event.id });
    updateTag("attendance");
    updateTag("dashboard");
    revalidatePath("/attendance");
    return { message: "Kegiatan berhasil dibuat." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Kegiatan gagal disimpan" }; }
}

export async function saveAttendance(_: AttendanceActionState, form: FormData): Promise<AttendanceActionState> {
  try {
    const user = await requirePermission("attendance.manage");
    const eventId = String(form.get("event_id") || "");
    const memberId = String(form.get("member_id") || "");
    const status = String(form.get("status") || "");
    const permissionUrl = String(form.get("permission_url") || "").trim() || null;
    if (!eventId || !memberId || !["present", "late", "partial", "permission", "absent"].includes(status)) throw new Error("Data kehadiran tidak lengkap");
    if (permissionUrl) new URL(permissionUrl);

    const { data: record, error } = await supabaseAdmin.from("attendance_records").upsert({
      event_id: eventId, member_id: memberId, status, points_awarded: 0, permission_url: status === "permission" ? permissionUrl : null, recorded_by: user.id, source: "manual", verification_status: "verified",
    }, { onConflict: "event_id,member_id" }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: `Mencatat kehadiran: ${status}`, entity_type: "attendance", entity_id: record.id, metadata: { event_id: eventId, member_id: memberId } });
    updateTag("attendance");
    revalidatePath("/attendance");
    return { message: "Kehadiran berhasil disimpan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Kehadiran gagal disimpan" }; }
}

export async function openAttendanceSession(_: AttendanceActionState, form: FormData): Promise<AttendanceActionState> {
  try {
    await requirePermission("attendance.manage");
    const eventId = String(form.get("event_id") || "");
    const duration = value(form, "duration");
    const radius = value(form, "radius");
    const lateAfter = value(form, "late_after");
    const minPresence = value(form, "min_presence");
    if (!eventId || !Number.isInteger(duration) || duration < 5 || duration > 180 || !Number.isInteger(radius) || radius < 25 || radius > 1000 || !Number.isInteger(lateAfter) || lateAfter < 0 || lateAfter > 180 || !Number.isInteger(minPresence) || minPresence < 0 || minPresence > 600) throw new Error("Pengaturan sesi tidak valid");
    const { data: event } = await supabaseAdmin.from("events").select("attendance_mode").eq("id", eventId).single();
    if (!event) throw new Error("Kegiatan tidak ditemukan");
    const latitude = value(form, "latitude");
    const longitude = value(form, "longitude");
    if (event.attendance_mode === "offline" && !validCoordinates(latitude, longitude, 0)) throw new Error("Ambil lokasi kegiatan terlebih dahulu");
    const token = randomUUID();
    const code = String(randomInt(100000, 1000000));
    const opened = new Date();
    const closed = new Date(opened.getTime() + duration * 60000);
    const { error } = await supabaseAdmin.from("events").update({
      attendance_token: token, attendance_code_hash: hash(code).toString("hex"), attendance_open_at: opened.toISOString(), attendance_close_at: closed.toISOString(), attendance_latitude: event.attendance_mode === "offline" ? latitude : null, attendance_longitude: event.attendance_mode === "offline" ? longitude : null, attendance_radius_m: radius, late_after_minutes: lateAfter, min_presence_minutes: minPresence, attendance_locked: false,
    }).eq("id", eventId);
    if (error) throw new Error(error.message);
    updateTag("attendance");
    return { message: `Sesi aktif sampai ${closed.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`, link: `/check-in/${token}`, code };
  } catch (error) { return { error: error instanceof Error ? error.message : "Sesi gagal dibuka" }; }
}

export async function submitSelfAttendance(_: AttendanceActionState, form: FormData): Promise<AttendanceActionState> {
  try {
    const memberId = await currentUserId();
    const token = String(form.get("token") || "");
    const intent = String(form.get("intent") || "check-in");
    if (!["check-in", "check-out"].includes(intent)) throw new Error("Tindakan absensi tidak valid");
    const { data: event } = await supabaseAdmin.from("events").select("id,starts_at,attendance_mode,attendance_code_hash,attendance_open_at,attendance_close_at,attendance_latitude,attendance_longitude,attendance_radius_m,late_after_minutes,min_presence_minutes,attendance_locked").eq("attendance_token", token).single();
    if (!event || event.attendance_locked) throw new Error("Sesi absensi tidak tersedia");
    const now = new Date();
    if (!event.attendance_open_at || !event.attendance_close_at) throw new Error("Sesi absensi belum dibuka");
    const { data: existing } = await supabaseAdmin.from("attendance_records").select("id,check_in_at,check_out_at,status,source,verification_status").eq("event_id", event.id).eq("member_id", memberId).maybeSingle();
    if (intent === "check-in" && (now < new Date(event.attendance_open_at) || now > new Date(event.attendance_close_at))) throw new Error("Waktu check-in sudah ditutup");
    if (intent === "check-out" && now > new Date(new Date(event.attendance_close_at).getTime() + 12 * 60 * 60000)) throw new Error("Waktu check-out sudah berakhir");
    const { data: member } = await supabaseAdmin.from("profiles").select("member_status").eq("id", memberId).single();
    if (member?.member_status !== "active") throw new Error("Hanya beswan aktif yang dapat mengisi absensi");

    const latitude = value(form, "latitude");
    const longitude = value(form, "longitude");
    const accuracy = value(form, "accuracy");
    let distance: number | null = null;
    let locationNote: string | null = null;
    if (event.attendance_mode === "offline") {
      if (!validCoordinates(latitude, longitude, accuracy)) throw new Error("Lokasi tidak valid. Aktifkan lokasi lalu coba lagi");
      distance = distanceMeters(Number(event.attendance_latitude), Number(event.attendance_longitude), latitude, longitude);
      if (accuracy <= 200 && distance > Number(event.attendance_radius_m) + accuracy) throw new Error("Kamu berada di luar radius kegiatan");
      if (accuracy > 200) { locationNote = `Akurasi lokasi rendah (${Math.round(accuracy)} m); perlu verifikasi pengurus`; distance = null; }
    }

    if (intent === "check-in") {
      const code = String(form.get("code") || "");
      if (!event.attendance_code_hash || !sameHash(code, event.attendance_code_hash)) throw new Error("Kode kegiatan salah");
      if (existing?.check_in_at) throw new Error("Kamu sudah check-in pada kegiatan ini");
      if (existing?.source === "manual" || existing?.verification_status === "verified") throw new Error("Kehadiranmu sudah dicatat dan disetujui pengurus");
      const lateAt = new Date(new Date(event.starts_at).getTime() + Number(event.late_after_minutes) * 60000);
      const { error } = await supabaseAdmin.from("attendance_records").upsert({ event_id: event.id, member_id: memberId, status: now > lateAt ? "late" : "present", points_awarded: 0, recorded_by: memberId, source: "self", verification_status: "pending", verification_note: locationNote, check_in_at: now.toISOString(), check_in_latitude: event.attendance_mode === "offline" ? latitude : null, check_in_longitude: event.attendance_mode === "offline" ? longitude : null, location_accuracy_m: event.attendance_mode === "offline" ? accuracy : null, distance_m: distance }, { onConflict: "event_id,member_id" });
      if (error) throw new Error(error.message);
    } else {
      if (!existing?.check_in_at || existing.check_out_at) throw new Error(existing?.check_out_at ? "Kamu sudah check-out" : "Lakukan check-in terlebih dahulu");
      const minutes = (now.getTime() - new Date(existing.check_in_at).getTime()) / 60000;
      const { error } = await supabaseAdmin.from("attendance_records").update({ check_out_at: now.toISOString(), status: minutes < Number(event.min_presence_minutes) ? "partial" : existing.status, verification_status: "pending" }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    await supabaseAdmin.from("activity_logs").insert({ actor_id: memberId, action: intent === "check-in" ? "Check-in mandiri" : "Check-out mandiri", entity_type: "attendance", entity_id: event.id });
    updateTag("attendance");
    revalidatePath(`/check-in/${token}`);
    return { message: intent === "check-in" ? "Check-in tercatat dan menunggu verifikasi." : "Check-out tercatat dan menunggu verifikasi." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Absensi gagal dikirim" }; }
}

export async function verifySelfAttendance(form: FormData) {
  const user = await requirePermission("attendance.manage");
  const recordId = String(form.get("record_id") || "");
  const decision = String(form.get("decision") || "");
  const status = String(form.get("status") || "");
  if (!recordId || !["verified", "rejected"].includes(decision) || !["present", "late", "partial", "permission", "absent"].includes(status)) throw new Error("Keputusan verifikasi tidak valid");
  const { data, error } = await supabaseAdmin.from("attendance_records").update({ verification_status: decision, status, recorded_by: user.id }).eq("id", recordId).select("member_id").single();
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: decision === "verified" ? "Menyetujui absensi mandiri" : "Menolak absensi mandiri", entity_type: "attendance", entity_id: recordId });
  updateTag("attendance");
  revalidatePath("/attendance");
  revalidatePath(`/points/${data.member_id}`);
}
