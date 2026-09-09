"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { positionName, sortOrder } from "@/backend/org-input";

export type ManagementActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshManagement() {
  updateTag("management"); updateTag("sections");
  revalidatePath("/management");
}

async function log(actorId: string, action: string, entityId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "management", entity_id: entityId });
}

export async function createPosition(_: ManagementActionState, form: FormData): Promise<ManagementActionState> {
  try {
    const actor = await requirePermission("system.manage");
    const period = await requireActivePeriod();
    const name = positionName(field(form, "name"));
    const { data, error } = await supabaseAdmin.from("positions").insert({ period_id: period.id, name, sort_order: sortOrder(field(form, "sort_order")) }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? `Jabatan ${name} sudah ada pada periode ini` : error.message);
    await log(actor.id, `Membuat jabatan ${name}`, data.id);
    refreshManagement();
    return { message: `Jabatan ${name} ditambahkan.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Jabatan gagal dibuat" }; }
}

export async function updatePosition(_: ManagementActionState, form: FormData): Promise<ManagementActionState> {
  try {
    const actor = await requirePermission("system.manage");
    const positionId = field(form, "position_id").trim();
    if (!positionId) throw new Error("Jabatan tidak dikenali");
    const name = positionName(field(form, "name"));
    const { error } = await supabaseAdmin.from("positions").update({ name, sort_order: sortOrder(field(form, "sort_order")) }).eq("id", positionId);
    if (error) throw new Error(error.code === "23505" ? `Jabatan ${name} sudah ada pada periode ini` : error.message);
    await log(actor.id, `Mengubah jabatan ${name}`, positionId);
    refreshManagement();
    return { message: "Jabatan berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Jabatan gagal diperbarui" }; }
}

export async function deletePosition(_: ManagementActionState, form: FormData): Promise<ManagementActionState> {
  try {
    const actor = await requirePermission("system.manage");
    const positionId = field(form, "position_id").trim();
    if (!positionId) throw new Error("Jabatan tidak dikenali");
    const { data: position, error: readError } = await supabaseAdmin.from("positions").select("name").eq("id", positionId).single();
    if (readError) throw new Error(readError.message);
    // management_members mengacu ke positions dengan on delete cascade, jadi
    // penugasan pengurus pada jabatan ini ikut hilang. Minta konfirmasi dulu.
    const { count } = await supabaseAdmin.from("management_members").select("*", { count: "exact", head: true }).eq("position_id", positionId);
    if (count && field(form, "confirmation").trim() !== "HAPUS") throw new Error(`Jabatan ini dipegang ${count} pengurus. Ketik HAPUS untuk melanjutkan.`);
    const { error } = await supabaseAdmin.from("positions").delete().eq("id", positionId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Menghapus jabatan ${position.name}`, positionId);
    refreshManagement();
    return { message: `Jabatan ${position.name} dihapus.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Jabatan gagal dihapus" }; }
}

export async function assignOfficer(_: ManagementActionState, form: FormData): Promise<ManagementActionState> {
  try {
    const actor = await requirePermission("system.manage");
    const period = await requireActivePeriod();
    const userId = field(form, "user_id").trim();
    const positionId = field(form, "position_id").trim();
    const divisionId = field(form, "division_id").trim();
    if (!userId || !positionId) throw new Error("Anggota dan jabatan wajib dipilih");
    const { error } = await supabaseAdmin.from("management_members").insert({ period_id: period.id, user_id: userId, position_id: positionId, division_id: divisionId || null });
    if (error) throw new Error(error.code === "23505" ? "Anggota ini sudah memegang jabatan tersebut" : error.message);
    await log(actor.id, "Menetapkan pengurus", positionId);
    refreshManagement();
    return { message: "Pengurus ditetapkan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Pengurus gagal ditetapkan" }; }
}

export async function removeOfficer(form: FormData) {
  const actor = await requirePermission("system.manage");
  const period = await requireActivePeriod();
  const userId = String(form.get("user_id") || "");
  const positionId = String(form.get("position_id") || "");
  if (!userId || !positionId) throw new Error("Pengurus tidak dikenali");
  const { error } = await supabaseAdmin.from("management_members").delete().eq("period_id", period.id).eq("user_id", userId).eq("position_id", positionId);
  if (error) throw new Error(error.message);
  await log(actor.id, "Melepas pengurus", positionId);
  refreshManagement();
}
