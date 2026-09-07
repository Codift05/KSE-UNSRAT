import "server-only";
import { createSupabaseServerClient } from "@/backend/supabase/server";

export type AttendanceEvent = { id: string; title: string; date: string; mode: string; presentPoints: number; permissionPoints: number; absentPoints: number };
export type AttendanceMember = { id: string; name: string };
export type AttendanceSummary = AttendanceMember & { totalPoints: number; present: number; late: number; partial: number; permission: number; absent: number };
export type AttendanceRecord = { id: string; event: string; member: string; status: string; points: number; updated: string };

export async function loadAttendance() {
  const supabase = await createSupabaseServerClient();
  const [eventsResult, membersResult, recordsResult] = await Promise.all([
    supabase.from("events").select("id,title,starts_at,attendance_mode,present_points,permission_points,absent_points,late_points,partial_points").order("starts_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id,full_name").eq("member_status", "active").order("full_name").limit(200),
    supabase.from("attendance_records").select("id,member_id,status,points_awarded,updated_at,events(title),profiles!attendance_records_member_id_fkey(full_name)").order("updated_at", { ascending: false }).limit(10000),
  ]);

  if (membersResult.error) throw new Error(`Gagal memuat anggota: ${membersResult.error.message}`);
  const schemaError = eventsResult.error || recordsResult.error;
  if (schemaError) {
    const missingSchema = /present_points|attendance_mode|late_points|partial_points|attendance_records|relationship/i.test(schemaError.message);
    if (!missingSchema) throw new Error(`Gagal memuat kehadiran: ${schemaError.message}`);
    const members: AttendanceMember[] = (membersResult.data || []).map(row => ({ id: String(row.id), name: String(row.full_name) }));
    return { events: [], members, records: [], summary: members.map(member => ({ ...member, totalPoints: 0, present: 0, late: 0, partial: 0, permission: 0, absent: 0 })), setupRequired: true };
  }

  const events: AttendanceEvent[] = (eventsResult.data || []).map(row => ({
    id: String(row.id), title: String(row.title), mode: row.attendance_mode === "online" ? "Online" : "Offline",
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(String(row.starts_at))),
    presentPoints: Number(row.present_points), permissionPoints: Number(row.permission_points), absentPoints: Number(row.absent_points),
  }));
  const members: AttendanceMember[] = (membersResult.data || []).map(row => ({ id: String(row.id), name: String(row.full_name) }));
  const totals = new Map(members.map(member => [member.id, { ...member, totalPoints: 0, present: 0, late: 0, partial: 0, permission: 0, absent: 0 }]));
  for (const record of recordsResult.data || []) {
    const member = totals.get(String(record.member_id));
    if (!member) continue;
    member.totalPoints += Number(record.points_awarded);
    member[record.status as "present" | "late" | "partial" | "permission" | "absent"] += 1;
  }

  const records: AttendanceRecord[] = (recordsResult.data || []).slice(0, 20).map(row => ({
    id: String(row.id), event: relation(row.events, "title"), member: relation(row.profiles, "full_name"), status: statusLabel(String(row.status)),
    points: Number(row.points_awarded), updated: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(String(row.updated_at))),
  }));
  return { events, members, records, summary: [...totals.values()].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)) as AttendanceSummary[], setupRequired: false };
}

function relation(value: unknown, key: string) {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object" ? String((item as Record<string, unknown>)[key] || "-") : "-";
}

const statusLabel = (status: string) => ({ present: "Hadir", late: "Terlambat", partial: "Hadir sebagian", permission: "Izin", absent: "Alpa" })[status] || status;
