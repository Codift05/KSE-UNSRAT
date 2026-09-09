"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { validatePeriodRange } from "@/backend/period-status";

export type PeriodActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "").trim();

function refreshPeriods() {
  updateTag("periods"); updateTag("sections");
  revalidatePath("/periods");
}

async function log(actorId: string, action: string, periodId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "period", entity_id: periodId });
}

export async function createPeriod(_: PeriodActionState, form: FormData): Promise<PeriodActionState> {
  try {
    const user = await requirePermission("system.manage");
    const { name, startsOn, endsOn } = validatePeriodRange(field(form, "name"), field(form, "starts_on"), field(form, "ends_on"));
    const { data, error } = await supabaseAdmin.from("periods").insert({ name, starts_on: startsOn, ends_on: endsOn }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? "Nama periode sudah dipakai" : error.message);
    await log(user.id, `Membuat periode ${name}`, data.id);
    refreshPeriods();
    return { message: `Periode ${name} dibuat sebagai draft. Aktifkan bila sudah siap.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Periode gagal dibuat" }; }
}

export async function updatePeriod(_: PeriodActionState, form: FormData): Promise<PeriodActionState> {
  try {
    const user = await requirePermission("system.manage");
    const periodId = field(form, "period_id");
    if (!periodId) throw new Error("Periode tidak dikenali");
    const { name, startsOn, endsOn } = validatePeriodRange(field(form, "name"), field(form, "starts_on"), field(form, "ends_on"));
    const { error } = await supabaseAdmin.from("periods").update({ name, starts_on: startsOn, ends_on: endsOn }).eq("id", periodId);
    if (error) throw new Error(error.code === "23505" ? "Nama periode sudah dipakai" : error.message);
    await log(user.id, `Mengubah periode ${name}`, periodId);
    refreshPeriods();
    return { message: "Periode berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Periode gagal diperbarui" }; }
}

export async function activatePeriod(form: FormData) {
  const user = await requirePermission("system.manage");
  const periodId = String(form.get("period_id") || "");
  if (!periodId) throw new Error("Periode tidak dikenali");
  // set_active_period menonaktifkan periode lain dan mengaktifkan target dalam
  // satu transaksi, karena indeks periods_one_active hanya memuat satu baris aktif.
  const { error } = await supabaseAdmin.rpc("set_active_period", { target_period_id: periodId });
  if (error) throw new Error(error.message);
  await log(user.id, "Mengaktifkan periode", periodId);
  refreshPeriods();
}

export async function archivePeriod(form: FormData) {
  const user = await requirePermission("system.manage");
  const periodId = String(form.get("period_id") || "");
  if (!periodId) throw new Error("Periode tidak dikenali");
  const { error } = await supabaseAdmin.from("periods").update({ is_active: false, archived_at: new Date().toISOString() }).eq("id", periodId);
  if (error) throw new Error(error.message);
  await log(user.id, "Mengarsipkan periode", periodId);
  refreshPeriods();
}

export async function deletePeriod(_: PeriodActionState, form: FormData): Promise<PeriodActionState> {
  try {
    const user = await requirePermission("system.manage");
    const periodId = field(form, "period_id");
    if (!periodId) throw new Error("Periode tidak dikenali");
    if (field(form, "confirmation") !== "HAPUS") throw new Error("Ketik HAPUS untuk menghapus periode");
    const { data: period, error: readError } = await supabaseAdmin.from("periods").select("name,is_active").eq("id", periodId).single();
    if (readError) throw new Error(readError.message);
    if (period.is_active) throw new Error("Periode aktif tidak dapat dihapus. Aktifkan periode lain lebih dulu.");
    const { error } = await supabaseAdmin.from("periods").delete().eq("id", periodId);
    if (error) throw new Error(error.message);
    await log(user.id, `Menghapus periode ${period.name}`, periodId);
    refreshPeriods();
    return { message: `Periode ${period.name} dihapus beserta divisi dan program di dalamnya.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Periode gagal dihapus" }; }
}
