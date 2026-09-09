import "server-only";
import { unstable_cache } from "next/cache";
import { currentUserId, hasPermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { organizationTimeZone } from "@/backend/time-format";
import { priorityLabel, taskStatusLabel } from "@/backend/program-input";

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  programId: string;
  programName: string;
  assigneeId: string;
  assigneeName: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  startsOn: string;
  dueOn: string;
  dueLabel: string;
  overdue: boolean;
};
export type Option = { id: string; name: string };

const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const isoToday = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: organizationTimeZone }).format(new Date());

const loadTaskRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  if (!period) return { periodName: "", tasks: [] as TaskRow[], programs: [] as Option[], members: [] as Option[] };

  const [{ data: programs }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("programs").select("id,name").eq("period_id", period.id).order("name"),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
  ]);
  const programIds = (programs || []).map(program => program.id);
  const { data: tasks, error } = programIds.length
    ? await supabaseAdmin.from("tasks").select("id,title,description,program_id,assignee_id,priority,status,starts_on,due_on").in("program_id", programIds).order("due_on", { nullsFirst: false }).limit(500)
    : { data: [], error: null };
  if (error) throw new Error(`Gagal memuat tugas: ${error.message}`);

  const programNameById = new Map((programs || []).map(program => [program.id, program.name]));
  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const today = isoToday();

  return {
    periodName: period.name,
    programs: (programs || []).map(program => ({ id: program.id, name: program.name })),
    members: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
    tasks: (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      programId: task.program_id,
      programName: programNameById.get(task.program_id) || "Program terhapus",
      assigneeId: task.assignee_id || "",
      assigneeName: task.assignee_id ? nameById.get(task.assignee_id) || "Tanpa nama" : "Belum ditugaskan",
      priority: task.priority,
      priorityLabel: priorityLabel(task.priority),
      status: task.status,
      statusLabel: taskStatusLabel(task.status),
      startsOn: task.starts_on || "",
      dueOn: task.due_on || "",
      dueLabel: task.due_on ? shortDate.format(new Date(`${task.due_on}T00:00:00`)) : "Tanpa tenggat",
      overdue: Boolean(task.due_on && task.due_on < today && task.status !== "done"),
    })),
  };
}, ["tasks"], { revalidate: 30, tags: ["tasks", "programs", "members"] });

export async function loadTasks() {
  const [userId, canSeeAll] = await Promise.all([currentUserId(), hasPermission("program.view")]);
  const data = await loadTaskRows();
  // Tanpa izin program.view, seseorang hanya melihat tugas miliknya sendiri.
  // Ini mencerminkan kebijakan RLS pada tabel tasks.
  const visible = canSeeAll ? data.tasks : data.tasks.filter(task => task.assigneeId === userId);
  return {
    ...data,
    tasks: visible,
    currentUserId: userId,
    scopeLabel: canSeeAll ? "Seluruh program" : "Tugas yang ditugaskan kepadamu",
    pendingCount: visible.filter(task => task.status !== "done").length,
    overdueCount: visible.filter(task => task.overdue).length,
    doneCount: visible.filter(task => task.status === "done").length,
  };
}
