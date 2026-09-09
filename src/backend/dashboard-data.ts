import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { greetingForHour, initialsOf, organizationTimeZone, relativeTimeLabel } from "@/backend/time-format";
import { programStatusLabel } from "@/backend/program-input";

export type ProgramProgress = { id: string; name: string; division: string; progress: number; due: string; status: string };
export type AgendaItem = { id: string; day: string; month: string; title: string; meta: string };
export type ActivityItem = { id: string; initials: string; name: string; text: string; time: string };
export type DashboardData = {
  greeting: string;
  todayLabel: string;
  periodName: string;
  activePrograms: number;
  pendingTasks: number;
  upcomingEvents: number;
  activeMembers: number;
  programs: ProgramProgress[];
  agenda: AgendaItem[];
  activity: ActivityItem[];
  overdueTasks: number;
  programsDueSoon: number;
  overdueInventory: number;
};
export type DocumentRow = { title: string; category: string; program: string; owner: string; updated: string; status: string };

const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: organizationTimeZone });
const longDate = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: organizationTimeZone });
const clock = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: organizationTimeZone });
const hourInOrganizationZone = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: organizationTimeZone });

export const loadDashboard = unstable_cache(async (): Promise<DashboardData> => {
  const now = new Date();
  // Tanggal batas juga memakai zona organisasi supaya "terlambat" tidak bergeser
  // sehari untuk pengguna di Manado ketika server menghitung dengan UTC.
  const today = dateInOrganizationZone(now);
  const soon = dateInOrganizationZone(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  const activeProgramStatus = ["planning", "ongoing", "evaluation"];

  const [programs, tasks, events, members, programRows, taskRows, eventRows, divisionRows, overdueLoans, dueSoon, activityRows] = await Promise.all([
    supabaseAdmin.from("programs").select("*", { count: "exact", head: true }).in("status", activeProgramStatus),
    supabaseAdmin.from("tasks").select("*", { count: "exact", head: true }).neq("status", "done"),
    supabaseAdmin.from("events").select("*", { count: "exact", head: true }).gte("starts_at", now.toISOString()),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("member_status", "active"),
    supabaseAdmin.from("programs").select("id,name,division_id,ends_on,status").in("status", activeProgramStatus).order("ends_on", { nullsFirst: false }).limit(5),
    // Progress program dihitung dari tugas selesai, sesuai PRD; tugas tanpa
    // program diabaikan karena tidak menyumbang progress ke mana pun.
    supabaseAdmin.from("tasks").select("program_id,status,due_on").not("program_id", "is", null).limit(2000),
    supabaseAdmin.from("events").select("id,title,type,starts_at,location").gte("starts_at", now.toISOString()).order("starts_at").limit(4),
    supabaseAdmin.from("divisions").select("id,name"),
    supabaseAdmin.from("inventory_transactions").select("*", { count: "exact", head: true }).is("returned_on", null).lt("expected_return_on", today).in("status", ["approved", "borrowed", "condition_check"]),
    supabaseAdmin.from("programs").select("*", { count: "exact", head: true }).in("status", activeProgramStatus).gte("ends_on", today).lte("ends_on", soon),
    supabaseAdmin.from("activity_logs").select("id,actor_id,action,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const divisionNameById = new Map((divisionRows.data || []).map(division => [division.id, division.name]));
  const actorIds = [...new Set((activityRows.data || []).map(row => row.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length ? await supabaseAdmin.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] };
  const actorNameById = new Map((actors || []).map(actor => [actor.id, actor.full_name]));
  const taskTally = (taskRows.data || []).reduce<Record<string, { done: number; total: number }>>((total, task) => {
    const entry = total[task.program_id] || { done: 0, total: 0 };
    return { ...total, [task.program_id]: { done: entry.done + (task.status === "done" ? 1 : 0), total: entry.total + 1 } };
  }, {});

  return {
    greeting: greetingForHour(Number(hourInOrganizationZone.format(now))),
    todayLabel: longDate.format(now),
    periodName: period?.name || "Belum ada periode aktif",
    activePrograms: programs.count || 0,
    pendingTasks: tasks.count || 0,
    upcomingEvents: events.count || 0,
    activeMembers: members.count || 0,
    programs: (programRows.data || []).map(program => {
      const tally = taskTally[program.id];
      return {
        id: program.id,
        name: program.name,
        division: program.division_id ? divisionNameById.get(program.division_id) || "Divisi terhapus" : "Lintas divisi",
        progress: tally?.total ? Math.round((tally.done / tally.total) * 100) : 0,
        due: program.ends_on ? shortDate.format(new Date(`${program.ends_on}T00:00:00`)) : "Tanpa tenggat",
        status: programStatusLabel(program.status),
      };
    }),
    agenda: (eventRows.data || []).map(event => {
      const startsAt = new Date(event.starts_at);
      const [day, month] = shortDate.format(startsAt).split(" ");
      return { id: event.id, day, month, title: event.title, meta: `${clock.format(startsAt)} · ${event.location || event.type}` };
    }),
    activity: (activityRows.data || []).map(row => {
      const name = row.actor_id ? actorNameById.get(row.actor_id) || "Pengguna terhapus" : "Sistem";
      // action disimpan sebagai kalimat berawalan huruf besar; huruf pertama
      // diturunkan agar menyambung wajar setelah nama pelaku.
      return { id: row.id, initials: initialsOf(name), name, text: row.action.charAt(0).toLowerCase() + row.action.slice(1), time: relativeTimeLabel(row.created_at, now) };
    }),
    overdueTasks: (taskRows.data || []).filter(task => task.status !== "done" && task.due_on && task.due_on < today).length,
    programsDueSoon: dueSoon.count || 0,
    overdueInventory: overdueLoans.count || 0,
  };
}, ["dashboard"], { revalidate: 15, tags: ["dashboard", "members", "divisions", "periods"] });

export const loadDocuments = unstable_cache(async (): Promise<DocumentRow[]> => {
  const { data, error } = await supabaseAdmin.from("documents").select("title, created_at, categories(name), programs(name), profiles(full_name)").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`Gagal memuat dokumen: ${error.message}`);

  return (data || []).map((item: Record<string, unknown>) => ({
    title: String(item.title),
    category: relationName(item.categories),
    program: relationName(item.programs, "Organisasi"),
    owner: relationName(item.profiles),
    updated: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(String(item.created_at))),
    status: "Lengkap",
  }));
}, ["documents"], { revalidate: 30, tags: ["documents"] });

function dateInOrganizationZone(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: organizationTimeZone }).format(value);
}

function relationName(value: unknown, fallback = "-") {
  if (Array.isArray(value)) return String(value[0]?.name || value[0]?.full_name || fallback);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name || record.full_name || fallback);
  }
  return fallback;
}
