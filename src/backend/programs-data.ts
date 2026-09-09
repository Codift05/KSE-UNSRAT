import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { organizationTimeZone } from "@/backend/time-format";
import { priorityLabel, programStatusLabel } from "@/backend/program-input";

export type ProgramRow = {
  id: string;
  name: string;
  description: string;
  divisionId: string;
  divisionName: string;
  picId: string;
  picName: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  startsOn: string;
  endsOn: string;
  dueLabel: string;
  budget: number;
  budgetLabel: string;
  doneTasks: number;
  totalTasks: number;
  progress: number;
};
export type Option = { id: string; name: string };

const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const loadProgramRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  if (!period) return { periodName: "", programs: [] as ProgramRow[], divisions: [] as Option[], members: [] as Option[] };

  const [{ data: programs, error }, { data: tasks }, { data: divisions }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("programs").select("id,name,description,division_id,pic_id,status,priority,starts_on,ends_on,budget").eq("period_id", period.id).order("ends_on", { nullsFirst: false }).limit(200),
    supabaseAdmin.from("tasks").select("program_id,status").limit(2000),
    supabaseAdmin.from("divisions").select("id,name").eq("period_id", period.id).order("name"),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
  ]);
  if (error) throw new Error(`Gagal memuat program: ${error.message}`);

  const divisionNameById = new Map((divisions || []).map(division => [division.id, division.name]));
  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const tally = (tasks || []).reduce<Record<string, { done: number; total: number }>>((total, task) => {
    const entry = total[task.program_id] || { done: 0, total: 0 };
    return { ...total, [task.program_id]: { done: entry.done + (task.status === "done" ? 1 : 0), total: entry.total + 1 } };
  }, {});

  return {
    periodName: period.name,
    divisions: (divisions || []).map(division => ({ id: division.id, name: division.name })),
    members: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
    programs: (programs || []).map(program => {
      const counted = tally[program.id] || { done: 0, total: 0 };
      return {
        id: program.id,
        name: program.name,
        description: program.description || "",
        divisionId: program.division_id || "",
        divisionName: program.division_id ? divisionNameById.get(program.division_id) || "Divisi terhapus" : "Lintas divisi",
        picId: program.pic_id || "",
        picName: program.pic_id ? nameById.get(program.pic_id) || "Tanpa nama" : "Belum ditetapkan",
        status: program.status,
        statusLabel: programStatusLabel(program.status),
        priority: program.priority,
        priorityLabel: priorityLabel(program.priority),
        startsOn: program.starts_on || "",
        endsOn: program.ends_on || "",
        dueLabel: program.ends_on ? shortDate.format(new Date(`${program.ends_on}T00:00:00`)) : "Tanpa tenggat",
        budget: Number(program.budget),
        budgetLabel: rupiah.format(Number(program.budget)),
        doneTasks: counted.done,
        totalTasks: counted.total,
        // Progress program berasal dari tugas selesai, sesuai PRD; program tanpa
        // tugas ditampilkan 0% dan bukan 100%.
        progress: counted.total ? Math.round((counted.done / counted.total) * 100) : 0,
      };
    }),
  };
}, ["programs"], { revalidate: 30, tags: ["programs", "tasks", "divisions", "members"] });

export async function loadPrograms() {
  await requirePermission("program.view");
  const data = await loadProgramRows();
  return {
    ...data,
    ongoingCount: data.programs.filter(program => program.status === "ongoing").length,
    completedCount: data.programs.filter(program => program.status === "completed").length,
    unassignedCount: data.programs.filter(program => !program.picId).length,
  };
}
