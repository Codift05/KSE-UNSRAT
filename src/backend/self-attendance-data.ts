import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

export async function loadSelfAttendance(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) throw new Error("Sesi tidak valid");
  const { data: event } = await supabaseAdmin.from("events").select("id,title,starts_at,attendance_mode,attendance_open_at,attendance_close_at,attendance_radius_m,attendance_locked").eq("attendance_token", token).single();
  if (!event) notFound();
  const { data: record } = await supabaseAdmin.from("attendance_records").select("status,source,verification_status,check_in_at,check_out_at").eq("event_id", event.id).eq("member_id", auth.claims.sub).maybeSingle();
  const now = new Date();
  const closeAt = event.attendance_close_at ? new Date(event.attendance_close_at) : null;
  return {
    event: { title: event.title, mode: event.attendance_mode === "online" ? "Online" : "Offline", startsAt: format(event.starts_at), radius: Number(event.attendance_radius_m) },
    isOpen: Boolean(!event.attendance_locked && event.attendance_open_at && event.attendance_close_at && now >= new Date(event.attendance_open_at) && now <= new Date(event.attendance_close_at)),
    canCheckOut: Boolean(!event.attendance_locked && closeAt && now <= new Date(closeAt.getTime() + 12 * 60 * 60000)),
    record: record ? { status: labels[record.status] || record.status, source: record.source, verification: record.verification_status, checkedIn: record.check_in_at ? format(record.check_in_at) : null, checkedOut: record.check_out_at ? format(record.check_out_at) : null } : null,
  };
}

const labels: Record<string, string> = { present: "Hadir", late: "Terlambat", partial: "Hadir sebagian", permission: "Izin", absent: "Alpa" };
const format = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
