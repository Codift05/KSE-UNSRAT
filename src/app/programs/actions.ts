"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { budgetValue, optionalDate, priorityValue, programName, programStatusValue, requireOrderedDates } from "@/backend/program-input";
import { optionalText } from "@/backend/member-profile";

export type ProgramActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshPrograms() {
  updateTag("programs"); updateTag("dashboard"); updateTag("sections");
  revalidatePath("/programs"); revalidatePath("/");
}

async function log(actorId: string, action: string, programId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "program", entity_id: programId });
}

function programFields(form: FormData) {
  const { startsOn, endsOn } = requireOrderedDates(optionalDate(field(form, "starts_on"), "Tanggal mulai"), optionalDate(field(form, "ends_on"), "Tenggat"), "tenggat");
  return {
    name: programName(field(form, "name")),
    description: optionalText(field(form, "description"), 300),
    division_id: field(form, "division_id").trim() || null,
    pic_id: field(form, "pic_id").trim() || null,
    status: programStatusValue(field(form, "status")),
    priority: priorityValue(field(form, "priority")),
    starts_on: startsOn,
    ends_on: endsOn,
    budget: budgetValue(field(form, "budget")),
  };
}

export async function createProgram(_: ProgramActionState, form: FormData): Promise<ProgramActionState> {
  try {
    const actor = await requirePermission("program.create");
    const period = await requireActivePeriod();
    const values = programFields(form);
    const { data, error } = await supabaseAdmin.from("programs").insert({ ...values, period_id: period.id, created_by: actor.id }).select("id").single();
    if (error) throw new Error(error.message);
    await log(actor.id, `Membuat program ${values.name}`, data.id);
    refreshPrograms();
    return { message: `Program ${values.name} dibuat pada periode ${period.name}.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Program gagal dibuat" }; }
}

export async function updateProgram(_: ProgramActionState, form: FormData): Promise<ProgramActionState> {
  try {
    const actor = await requirePermission("program.update");
    const programId = field(form, "program_id").trim();
    if (!programId) throw new Error("Program tidak dikenali");
    const values = programFields(form);
    const { error } = await supabaseAdmin.from("programs").update({ ...values, updated_at: new Date().toISOString() }).eq("id", programId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Mengubah program ${values.name}`, programId);
    refreshPrograms();
    return { message: "Program berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Program gagal diperbarui" }; }
}

export async function deleteProgram(_: ProgramActionState, form: FormData): Promise<ProgramActionState> {
  try {
    const actor = await requirePermission("program.delete");
    const programId = field(form, "program_id").trim();
    if (!programId) throw new Error("Program tidak dikenali");
    const { data: program, error: readError } = await supabaseAdmin.from("programs").select("name").eq("id", programId).single();
    if (readError) throw new Error(readError.message);
    // tasks mengacu ke programs dengan on delete cascade, jadi seluruh tugas di
    // dalamnya ikut hilang. Minta konfirmasi bila masih ada tugas.
    const { count } = await supabaseAdmin.from("tasks").select("*", { count: "exact", head: true }).eq("program_id", programId);
    if (count && field(form, "confirmation").trim() !== "HAPUS") throw new Error(`Program ini punya ${count} tugas. Ketik HAPUS untuk melanjutkan.`);
    const { error } = await supabaseAdmin.from("programs").delete().eq("id", programId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Menghapus program ${program.name}`, programId);
    refreshPrograms();
    return { message: `Program ${program.name} dihapus beserta tugas di dalamnya.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Program gagal dihapus" }; }
}

export async function setProgramStatus(form: FormData) {
  const actor = await requirePermission("program.update");
  const programId = String(form.get("program_id") || "");
  const status = programStatusValue(String(form.get("status") || ""));
  if (!programId) throw new Error("Program tidak dikenali");
  const { error } = await supabaseAdmin.from("programs").update({ status, updated_at: new Date().toISOString() }).eq("id", programId);
  if (error) throw new Error(error.message);
  await log(actor.id, `Mengubah status program menjadi ${status}`, programId);
  refreshPrograms();
}
