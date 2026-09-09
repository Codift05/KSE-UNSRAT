"use server";

import { revalidatePath, updateTag } from "next/cache";
import { currentUserId, hasPermission, requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { optionalDate, priorityValue, requireOrderedDates, taskStatusValue, taskTitle } from "@/backend/program-input";
import { optionalText } from "@/backend/member-profile";

export type TaskActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshTasks() {
  updateTag("tasks"); updateTag("programs"); updateTag("dashboard"); updateTag("sections");
  revalidatePath("/tasks"); revalidatePath("/programs"); revalidatePath("/");
}

async function log(actorId: string, action: string, taskId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "task", entity_id: taskId });
}

// Penerima tugas boleh mengubah tugasnya sendiri; selain itu perlu task.assign.
// Aturan ini menyalin kebijakan RLS pada tabel tasks agar jalur service-role
// tidak lebih longgar daripada jalur biasa.
async function requireTaskAccess(taskId: string) {
  const [userId, canAssign] = await Promise.all([currentUserId(), hasPermission("task.assign")]);
  if (canAssign) return { id: userId, canAssign };
  const { data, error } = await supabaseAdmin.from("tasks").select("assignee_id").eq("id", taskId).single();
  if (error) throw new Error(error.message);
  if (data.assignee_id !== userId) throw new Error("Kamu hanya dapat mengubah tugas yang ditugaskan kepadamu");
  return { id: userId, canAssign };
}

function taskFields(form: FormData) {
  const { startsOn, endsOn } = requireOrderedDates(optionalDate(field(form, "starts_on"), "Tanggal mulai"), optionalDate(field(form, "due_on"), "Tenggat"), "tenggat");
  return {
    title: taskTitle(field(form, "title")),
    description: optionalText(field(form, "description"), 300),
    program_id: field(form, "program_id").trim(),
    assignee_id: field(form, "assignee_id").trim() || null,
    priority: priorityValue(field(form, "priority")),
    status: taskStatusValue(field(form, "status")),
    starts_on: startsOn,
    due_on: endsOn,
  };
}

export async function createTask(_: TaskActionState, form: FormData): Promise<TaskActionState> {
  try {
    const actor = await requirePermission("task.create");
    const values = taskFields(form);
    if (!values.program_id) throw new Error("Tugas harus melekat pada satu program");
    const { data, error } = await supabaseAdmin.from("tasks").insert({ ...values, created_by: actor.id }).select("id").single();
    if (error) throw new Error(error.message);
    await log(actor.id, `Membuat tugas ${values.title}`, data.id);
    refreshTasks();
    return { message: `Tugas ${values.title} dibuat.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Tugas gagal dibuat" }; }
}

export async function updateTask(_: TaskActionState, form: FormData): Promise<TaskActionState> {
  try {
    const taskId = field(form, "task_id").trim();
    if (!taskId) throw new Error("Tugas tidak dikenali");
    const actor = await requireTaskAccess(taskId);
    const values = taskFields(form);
    if (!values.program_id) throw new Error("Tugas harus melekat pada satu program");
    // Penerima tugas tanpa task.assign tidak boleh memindahkan tugas ke orang lain.
    const patch = actor.canAssign ? values : { ...values, assignee_id: actor.id };
    const { error } = await supabaseAdmin.from("tasks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", taskId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Mengubah tugas ${values.title}`, taskId);
    refreshTasks();
    return { message: "Tugas berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Tugas gagal diperbarui" }; }
}

export async function setTaskStatus(form: FormData) {
  const taskId = String(form.get("task_id") || "");
  if (!taskId) throw new Error("Tugas tidak dikenali");
  const actor = await requireTaskAccess(taskId);
  const status = taskStatusValue(String(form.get("status") || ""));
  const { error } = await supabaseAdmin.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) throw new Error(error.message);
  await log(actor.id, `Mengubah status tugas menjadi ${status}`, taskId);
  refreshTasks();
}

export async function deleteTask(_: TaskActionState, form: FormData): Promise<TaskActionState> {
  try {
    const actor = await requirePermission("task.assign");
    const taskId = field(form, "task_id").trim();
    if (!taskId) throw new Error("Tugas tidak dikenali");
    const { data: task, error: readError } = await supabaseAdmin.from("tasks").select("title").eq("id", taskId).single();
    if (readError) throw new Error(readError.message);
    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", taskId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Menghapus tugas ${task.title}`, taskId);
    refreshTasks();
    return { message: `Tugas ${task.title} dihapus.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Tugas gagal dihapus" }; }
}
