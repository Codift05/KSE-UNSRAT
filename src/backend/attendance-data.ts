import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { organizationTimeZone } from "@/backend/time-format";
import { attendanceStanding, memberStatusLabel } from "@/backend/attendance-status";

export type AttendanceEvent = { id: string; title: string; date: string; mode: string; presentPoints: number; permissionPoints: number; absentPoints: number; sessionOpen: boolean; sessionLink: string | null };
export type AttendanceMember = { id: string; name: string };
export type AttendanceSummary = AttendanceMember & { rank: number; memberStatus: string; activity: string; warning: string; totalPoints: number; present: number; late: number; partial: number; permission: number; absent: number };
export type AttendanceRecord = { id: string; event: string; member: string; rawStatus: string; status: string; points: number; updated: string; source: string; verification: string; checkIn: string | null; checkOut: string | null; distance: number | null; accuracy: number | null; note: string | null };

export const loadAttendance = unstable_cache(async () => {
  const { data: period, error: periodError } = await supabaseAdmin.from("periods").select("id").eq("is_active", true).single();
  if (periodError || !period) throw new Error(`Gagal memuat periode aktif: ${periodError?.message || "periode belum tersedia"}`);
  const [eventsResult, membersResult, recordsResult] = await Promise.all([
    supabaseAdmin.from("events").select("id,title,starts_at,attendance_mode,present_points,permission_points,absent_points,late_points,partial_points,attendance_token,attendance_open_at,attendance_close_at,attendance_locked").eq("period_id", period.id).order("starts_at", { ascending: false }).limit(100),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(200),
    supabaseAdmin.from("attendance_records").select("id,member_id,status,points_awarded,updated_at,source,verification_status,verification_note,check_in_at,check_out_at,distance_m,location_accuracy_m,events!inner(title,period_id),profiles!attendance_records_member_id_fkey(full_name)").eq("events.period_id", period.id).order("updated_at", { ascending: false }).limit(10000),
  ]);

  if (membersResult.error) throw new Error(`Gagal memuat anggota: ${membersResult.error.message}`);
  const schemaError = eventsResult.error || recordsResult.error;
  if (schemaError) {
    const missingSchema = /present_points|attendance_mode|late_points|partial_points|attendance_token|verification_status|attendance_records|relationship/i.test(schemaError.message);
    if (!missingSchema) throw new Error(`Gagal memuat kehadiran: ${schemaError.message}`);
    const members: AttendanceMember[] = (membersResult.data || []).filter(row => row.member_status === "active").map(row => ({ id: String(row.id), name: String(row.full_name) }));
    return { events: [], members, records: [], pendingRecords: [], summary: [], setupRequired: true };
  }

  const events: AttendanceEvent[] = (eventsResult.data || []).map(row => ({
    id: String(row.id), title: String(row.title), mode: row.attendance_mode === "online" ? "Online" : "Offline",
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone }).format(new Date(String(row.starts_at))),
    presentPoints: Number(row.present_points), permissionPoints: Number(row.permission_points), absentPoints: Number(row.absent_points),
    sessionOpen: Boolean(row.attendance_token && !row.attendance_locked && row.attendance_close_at && new Date(String(row.attendance_close_at)) > new Date()), sessionLink: row.attendance_token ? `/check-in/${row.attendance_token}` : null,
  }));
  const members: AttendanceMember[] = (membersResult.data || []).filter(row => row.member_status === "active").map(row => ({ id: String(row.id), name: String(row.full_name) }));
  const totals = new Map((membersResult.data || []).map(row => [String(row.id), { id: String(row.id), name: String(row.full_name), memberStatus: memberStatusLabel(String(row.member_status)), totalPoints: 0, present: 0, late: 0, partial: 0, permission: 0, absent: 0 }]));
  for (const record of recordsResult.data || []) {
    const member = totals.get(String(record.member_id));
    if (!member || record.verification_status !== "verified") continue;
    member.totalPoints += Number(record.points_awarded);
    member[record.status as "present" | "late" | "partial" | "permission" | "absent"] += 1;
  }

  type RecordRow = NonNullable<typeof recordsResult.data>[number];
  const mapRecord = (row: RecordRow): AttendanceRecord => ({
    id: String(row.id), event: relation(row.events, "title"), member: relation(row.profiles, "full_name"), rawStatus: String(row.status), status: statusLabel(String(row.status)),
    points: Number(row.points_awarded), updated: time(row.updated_at), source: String(row.source), verification: String(row.verification_status), checkIn: row.check_in_at ? time(row.check_in_at) : null, checkOut: row.check_out_at ? time(row.check_out_at) : null, distance: row.distance_m === null ? null : Number(row.distance_m), accuracy: row.location_accuracy_m === null ? null : Number(row.location_accuracy_m), note: row.verification_note ? String(row.verification_note) : null,
  });
  const records: AttendanceRecord[] = (recordsResult.data || []).slice(0, 20).map(mapRecord);
  const pendingRecords: AttendanceRecord[] = (recordsResult.data || []).filter(row => row.verification_status === "pending").map(mapRecord);
  const summary = [...totals.values()].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)).map((member, index) => ({ ...member, rank: index + 1, ...attendanceStanding(member.present, member.late, member.partial, member.absent) }));
  return { events, members, records, pendingRecords, summary: summary as AttendanceSummary[], setupRequired: false };
}, ["attendance"], { revalidate: 30, tags: ["attendance"] });

function relation(value: unknown, key: string) {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object" ? String((item as Record<string, unknown>)[key] || "-") : "-";
}

const statusLabel = (status: string) => ({ present: "Hadir", late: "Terlambat", partial: "Hadir sebagian", permission: "Izin", absent: "Alpa" })[status] || status;
const time = (value: unknown) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: organizationTimeZone }).format(new Date(String(value)));
