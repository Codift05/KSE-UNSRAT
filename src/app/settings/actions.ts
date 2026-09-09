"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { rootPermission } from "@/backend/permission-group";

export type SettingsActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshSettings() {
  updateTag("settings"); updateTag("sections");
  revalidatePath("/settings");
}

async function log(actorId: string, action: string, entityId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "settings", entity_id: entityId });
}

// Daftar role yang memberi izin pengelola sistem. Dipakai untuk memastikan
// tidak ada perubahan yang menyisakan organisasi tanpa satu pun pengelola —
// kondisi yang tidak bisa diperbaiki lagi dari dalam aplikasi.
async function rootRoleIds() {
  const { data: permission } = await supabaseAdmin.from("permissions").select("id").eq("key", rootPermission).single();
  if (!permission) return [];
  const { data } = await supabaseAdmin.from("role_permissions").select("role_id").eq("permission_id", permission.id);
  return (data || []).map(row => row.role_id);
}

async function countRootHolders(periodId: string, roleIds: string[]) {
  if (!roleIds.length) return [];
  const { data } = await supabaseAdmin.from("user_roles").select("user_id,role_id").eq("period_id", periodId).in("role_id", roleIds);
  return data || [];
}

export async function setRolePermission(form: FormData) {
  const actor = await requirePermission(rootPermission);
  const period = await requireActivePeriod();
  const roleId = String(form.get("role_id") || "");
  const permissionId = String(form.get("permission_id") || "");
  const enable = String(form.get("enable") || "") === "true";
  if (!roleId || !permissionId) throw new Error("Role atau permission tidak dikenali");

  if (enable) {
    const { error } = await supabaseAdmin.from("role_permissions").insert({ role_id: roleId, permission_id: permissionId });
    if (error && error.code !== "23505") throw new Error(error.message);
  } else {
    const { data: permission } = await supabaseAdmin.from("permissions").select("key").eq("id", permissionId).single();
    if (permission?.key === rootPermission) {
      const remaining = (await rootRoleIds()).filter(id => id !== roleId);
      const holders = await countRootHolders(period.id, remaining);
      if (!holders.length) throw new Error("Perubahan ini menyisakan organisasi tanpa pengelola sistem. Beri izin ini ke role lain lebih dulu.");
    }
    const { error } = await supabaseAdmin.from("role_permissions").delete().eq("role_id", roleId).eq("permission_id", permissionId);
    if (error) throw new Error(error.message);
  }
  await log(actor.id, enable ? "Menambahkan permission ke role" : "Mencabut permission dari role", roleId);
  refreshSettings();
}

export async function assignUserRole(_: SettingsActionState, form: FormData): Promise<SettingsActionState> {
  try {
    const actor = await requirePermission(rootPermission);
    const period = await requireActivePeriod();
    const userId = field(form, "user_id").trim();
    const roleId = field(form, "role_id").trim();
    if (!userId || !roleId) throw new Error("Anggota dan role wajib dipilih");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role_id: roleId, period_id: period.id });
    if (error) throw new Error(error.code === "23505" ? "Anggota ini sudah memegang role tersebut" : error.message);
    await log(actor.id, "Menetapkan role pengguna", userId);
    refreshSettings();
    return { message: "Role ditetapkan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Role gagal ditetapkan" }; }
}

export async function removeUserRole(form: FormData) {
  const actor = await requirePermission(rootPermission);
  const period = await requireActivePeriod();
  const userId = String(form.get("user_id") || "");
  const roleId = String(form.get("role_id") || "");
  if (!userId || !roleId) throw new Error("Anggota atau role tidak dikenali");

  const rootRoles = await rootRoleIds();
  if (rootRoles.includes(roleId)) {
    const holders = await countRootHolders(period.id, rootRoles);
    const remaining = holders.filter(holder => !(holder.user_id === userId && holder.role_id === roleId));
    if (!remaining.length) throw new Error("Ini satu-satunya pemegang izin pengelola sistem. Tetapkan pengelola lain lebih dulu.");
  }

  const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId).eq("period_id", period.id);
  if (error) throw new Error(error.message);
  await log(actor.id, "Mencabut role pengguna", userId);
  refreshSettings();
}
