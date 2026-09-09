"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type AccountActionState = { message?: string; error?: string };

const email = (form: FormData) => String(form.get("email") || "").trim().toLowerCase();
const name = (form: FormData) => String(form.get("full_name") || "").trim();

export async function createAccount(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  try {
    const user = await requirePermission("system.manage");
    const fullName = name(form);
    const address = email(form);
    const password = String(form.get("password") || "");
    if (fullName.length < 2 || fullName.length > 100) throw new Error("Nama harus 2–100 karakter");
    if (!/^\S+@\S+\.\S+$/.test(address)) throw new Error("Email tidak valid");
    if (password.length < 8) throw new Error("Password awal minimal 8 karakter");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email: address, password, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error || !data.user) throw new Error(error?.message || "Akun gagal dibuat");
    const { error: profileError } = await supabaseAdmin.from("profiles").update({ full_name: fullName, member_status: "active" }).eq("id", data.user.id);
    if (profileError) throw new Error(profileError.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: user.id, action: "Membuat akun beswan", entity_type: "account", entity_id: data.user.id });
    updateTag("profiles"); updateTag("accounts"); revalidatePath("/accounts");
    return { message: "Akun berhasil dibuat. Sampaikan email dan password awal kepada beswan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Akun gagal dibuat" }; }
}

export async function setAccountAccess(form: FormData) {
  const admin = await requirePermission("system.manage");
  const accountId = String(form.get("account_id") || "");
  const access = String(form.get("access") || "");
  if (!accountId || !["enable", "disable"].includes(access)) throw new Error("Perubahan akses tidak valid");
  if (accountId === admin.id) throw new Error("Kamu tidak dapat menonaktifkan akun sendiri");
  const { error } = await supabaseAdmin.auth.admin.updateUserById(accountId, { ban_duration: access === "disable" ? "876000h" : "none" });
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("profiles").update({ member_status: access === "disable" ? "inactive" : "active" }).eq("id", accountId);
  await supabaseAdmin.from("activity_logs").insert({ actor_id: admin.id, action: access === "disable" ? "Menonaktifkan akun" : "Mengaktifkan akun", entity_type: "account", entity_id: accountId });
  updateTag("profiles"); updateTag("accounts"); revalidatePath("/accounts");
}

export async function resetAccountPassword(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  try {
    const admin = await requirePermission("system.manage");
    const accountId = String(form.get("account_id") || "");
    const password = String(form.get("password") || "");
    if (!accountId || password.length < 8) throw new Error("Password baru minimal 8 karakter");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(accountId, { password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: admin.id, action: "Mengatur ulang password akun", entity_type: "account", entity_id: accountId });
    return { message: "Password berhasil diatur ulang." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Password gagal diatur ulang" }; }
}

export async function deleteAccount(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  try {
    const admin = await requirePermission("system.manage");
    const accountId = String(form.get("account_id") || "");
    if (String(form.get("confirmation") || "") !== "HAPUS") throw new Error("Ketik HAPUS untuk menghapus akun permanen");
    if (!accountId || accountId === admin.id) throw new Error("Kamu tidak dapat menghapus akun sendiri");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(accountId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: admin.id, action: "Menghapus akun permanen", entity_type: "account", entity_id: accountId });
    updateTag("profiles"); updateTag("accounts"); revalidatePath("/accounts");
    return { message: "Akun berhasil dihapus." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Akun gagal dihapus" }; }
}
