import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requirePermission } from "@/backend/authorization";

export type PointEntry = { id: string; event: string; date: string; mode: string; status: string; points: number; permissionUrl: string | null };

export async function loadMemberPoints(memberId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  if (user.id !== memberId) try { await requirePermission("attendance.view"); } catch { notFound(); }
  const [profileResult, periodResult] = await Promise.all([supabaseAdmin.from("profiles").select("full_name,study_program,cohort_year").eq("id", memberId).single(), supabaseAdmin.from("periods").select("id,name").eq("is_active", true).single()]);
  if (profileResult.error || !periodResult.data) notFound();
  const { data, error } = await supabaseAdmin.from("attendance_records").select("id,status,points_awarded,permission_url,events!inner(title,starts_at,attendance_mode,period_id)").eq("member_id", memberId).eq("events.period_id", periodResult.data.id).order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat detail poin: ${error.message}`);
  const labels: Record<string, string> = { present: "Hadir", late: "Terlambat", partial: "Hadir sebagian", permission: "Izin", absent: "Alpa" };
  const entries: PointEntry[] = (data || []).map(row => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    return { id: String(row.id), event: String(event?.title || "-"), date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(String(event?.starts_at))), mode: event?.attendance_mode === "online" ? "Online" : "Offline", status: labels[String(row.status)] || String(row.status), points: Number(row.points_awarded), permissionUrl: row.permission_url };
  });
  const count = (status: string) => entries.filter(entry => entry.status === status).length;
  return { member: { id: memberId, name: profileResult.data.full_name, studyProgram: profileResult.data.study_program || "Program studi belum diisi", cohortYear: profileResult.data.cohort_year ? String(profileResult.data.cohort_year) : "-" }, period: periodResult.data.name, totalPoints: entries.reduce((sum, entry) => sum + entry.points, 0), present: count("Hadir") + count("Terlambat"), partial: count("Hadir sebagian"), permission: count("Izin"), absent: count("Alpa"), entries };
}
