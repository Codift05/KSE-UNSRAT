"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";

const number = (value: FormDataEntryValue | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Nilai poin tidak valid");
  return parsed;
};

export type AttendanceActionState = { message?: string; error?: string };

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
      period_id: period.id, title, type: "attendance", starts_at: new Date(`${startsAt}:00+07:00`).toISOString(), created_by: user.id,
      attendance_mode: mode, present_points: fullPoints, late_points: fullPoints, partial_points: fullPoints / 2, permission_points: 0, absent_points: number(form.get("absent_points")),
    }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: "Membuat kegiatan kehadiran", entity_type: "event", entity_id: event.id });
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
      event_id: eventId, member_id: memberId, status, points_awarded: 0, permission_url: status === "permission" ? permissionUrl : null, recorded_by: user.id,
    }, { onConflict: "event_id,member_id" }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: `Mencatat kehadiran: ${status}`, entity_type: "attendance", entity_id: record.id, metadata: { event_id: eventId, member_id: memberId } });
    revalidatePath("/attendance");
    return { message: "Kehadiran berhasil disimpan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Kehadiran gagal disimpan" }; }
}
