import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { attendanceEventType, eventTypeLabel } from "@/backend/event-input";
import { isoToOrganizationDateTime, organizationTimeZone } from "@/backend/time-format";

export type CalendarRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  typeLabel: string;
  programId: string;
  programName: string;
  location: string;
  startsAtIso: string;
  endsAtIso: string;
  startsAtInput: string;
  endsAtInput: string;
  dayLabel: string;
  timeLabel: string;
  upcoming: boolean;
  managedByAttendance: boolean;
};
export type Option = { id: string; name: string };

const dayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: organizationTimeZone });

const loadCalendarRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  if (!period) return { periodName: "", events: [] as CalendarRow[], programs: [] as Option[] };

  const [{ data: events, error }, { data: programs }] = await Promise.all([
    supabaseAdmin.from("events").select("id,title,description,type,program_id,location,starts_at,ends_at").eq("period_id", period.id).order("starts_at", { ascending: false }).limit(300),
    supabaseAdmin.from("programs").select("id,name").eq("period_id", period.id).order("name"),
  ]);
  if (error) throw new Error(`Gagal memuat agenda: ${error.message}`);

  const programNameById = new Map((programs || []).map(program => [program.id, program.name]));
  const now = new Date().toISOString();

  return {
    periodName: period.name,
    programs: (programs || []).map(program => ({ id: program.id, name: program.name })),
    events: (events || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || "",
      type: event.type,
      typeLabel: eventTypeLabel(event.type),
      programId: event.program_id || "",
      programName: event.program_id ? programNameById.get(event.program_id) || "Program terhapus" : "Organisasi",
      location: event.location || "",
      startsAtIso: event.starts_at,
      endsAtIso: event.ends_at || "",
      startsAtInput: isoToOrganizationDateTime(event.starts_at),
      endsAtInput: event.ends_at ? isoToOrganizationDateTime(event.ends_at) : "",
      dayLabel: dayFormat.format(new Date(event.starts_at)),
      timeLabel: event.ends_at ? `${timeFormat.format(new Date(event.starts_at))} – ${timeFormat.format(new Date(event.ends_at))}` : timeFormat.format(new Date(event.starts_at)),
      upcoming: event.starts_at >= now,
      managedByAttendance: event.type === attendanceEventType,
    })),
  };
}, ["calendar"], { revalidate: 30, tags: ["calendar", "attendance", "programs"] });

export async function loadCalendar() {
  await requirePermission("member.view");
  const data = await loadCalendarRows();
  const upcoming = data.events.filter(event => event.upcoming);
  return {
    ...data,
    upcomingCount: upcoming.length,
    weekCount: upcoming.filter(event => event.startsAtIso <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).length,
    attendanceCount: data.events.filter(event => event.managedByAttendance).length,
  };
}
