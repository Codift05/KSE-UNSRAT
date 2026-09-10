"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { assignMemberToDivision, requireActivePeriod } from "@/backend/division-assignment";
import { divisionName } from "@/backend/org-input";
import { optionalText } from "@/backend/member-profile";

export type DivisionActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshDivisions() {
  updateTag("divisions"); updateTag("members"); updateTag("sections");
  revalidatePath("/divisions"); revalidatePath("/members");
}

// Daftar pilihan pada formulir dapat menjadi basi bila anggotanya dihapus
// sementara halaman masih terbuka. Postgres menolaknya dengan pesan teknis;
// pengurus perlu tahu apa yang harus dilakukan, bukan nama constraint.
function readable(message: string, code?: string) {
  if (code === "23503") return "Anggota yang dipilih sudah tidak ada. Muat ulang halaman lalu pilih kembali.";
  return message;
}

async function log(actorId: string, action: string, divisionId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "division", entity_id: divisionId });
}

export async function createDivision(_: DivisionActionState, form: FormData): Promise<DivisionActionState> {
  try {
    const actor = await requirePermission("member.update");
    const period = await requireActivePeriod();
    const name = divisionName(field(form, "name"));
    const coordinatorId = field(form, "coordinator_id").trim();
    const { data, error } = await supabaseAdmin.from("divisions").insert({
      period_id: period.id,
      name,
      description: optionalText(field(form, "description"), 300),
      coordinator_id: coordinatorId || null,
    }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? `Divisi ${name} sudah ada pada periode ini` : readable(error.message, error.code));
    // Koordinator adalah anggota divisinya sendiri. Tanpa ini, menunjuk
    // koordinator menyisakan divisi berisi nol anggota dan orang itu tetap
    // terhitung "belum berdivisi", yang membingungkan saat membaca statistik.
    if (coordinatorId) await assignMemberToDivision(coordinatorId, data.id, period.id);
    await log(actor.id, `Membuat divisi ${name}`, data.id);
    refreshDivisions();
    return { message: `Divisi ${name} dibuat pada periode ${period.name}.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Divisi gagal dibuat" }; }
}

export async function updateDivision(_: DivisionActionState, form: FormData): Promise<DivisionActionState> {
  try {
    const actor = await requirePermission("member.update");
    const period = await requireActivePeriod();
    const divisionId = field(form, "division_id").trim();
    if (!divisionId) throw new Error("Divisi tidak dikenali");
    const name = divisionName(field(form, "name"));
    const coordinatorId = field(form, "coordinator_id").trim();
    const { error } = await supabaseAdmin.from("divisions").update({
      name,
      description: optionalText(field(form, "description"), 300),
      coordinator_id: coordinatorId || null,
    }).eq("id", divisionId);
    if (error) throw new Error(error.code === "23505" ? `Divisi ${name} sudah ada pada periode ini` : readable(error.message, error.code));
    // Koordinator baru ikut menjadi anggota. Koordinator lama tidak dikeluarkan
    // otomatis karena ia bisa saja tetap anggota biasa di divisi yang sama.
    if (coordinatorId) await assignMemberToDivision(coordinatorId, divisionId, period.id);
    await log(actor.id, `Mengubah divisi ${name}`, divisionId);
    refreshDivisions();
    return { message: "Divisi berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Divisi gagal diperbarui" }; }
}

export async function deleteDivision(_: DivisionActionState, form: FormData): Promise<DivisionActionState> {
  try {
    const actor = await requirePermission("member.update");
    const divisionId = field(form, "division_id").trim();
    if (!divisionId) throw new Error("Divisi tidak dikenali");
    if (field(form, "confirmation").trim() !== "HAPUS") throw new Error("Ketik HAPUS untuk menghapus divisi");
    const { data: division, error: readError } = await supabaseAdmin.from("divisions").select("name").eq("id", divisionId).single();
    if (readError) throw new Error(readError.message);
    // Program yang menunjuk divisi ini tidak ikut terhapus; division_id-nya
    // menjadi null mengikuti "on delete set null" pada skema.
    const { error } = await supabaseAdmin.from("divisions").delete().eq("id", divisionId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Menghapus divisi ${division.name}`, divisionId);
    refreshDivisions();
    return { message: `Divisi ${division.name} dihapus. Anggotanya kembali tanpa divisi.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Divisi gagal dihapus" }; }
}

export async function addDivisionMember(_: DivisionActionState, form: FormData): Promise<DivisionActionState> {
  try {
    const actor = await requirePermission("member.update");
    const period = await requireActivePeriod();
    const divisionId = field(form, "division_id").trim();
    const memberId = field(form, "member_id").trim();
    if (!divisionId || !memberId) throw new Error("Divisi atau anggota tidak dikenali");
    await assignMemberToDivision(memberId, divisionId, period.id);
    await log(actor.id, "Menambahkan anggota ke divisi", divisionId);
    refreshDivisions();
    return { message: "Anggota ditambahkan ke divisi." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Anggota gagal ditambahkan" }; }
}

export async function removeDivisionMember(form: FormData) {
  const actor = await requirePermission("member.update");
  const divisionId = String(form.get("division_id") || "");
  const memberId = String(form.get("member_id") || "");
  if (!divisionId || !memberId) throw new Error("Divisi atau anggota tidak dikenali");
  const { error } = await supabaseAdmin.from("division_members").delete().eq("division_id", divisionId).eq("member_id", memberId);
  if (error) throw new Error(error.message);
  await log(actor.id, "Melepas anggota dari divisi", divisionId);
  refreshDivisions();
}
