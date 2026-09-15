"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { deleteDriveFile, uploadFile } from "@/backend/drive-client";
import { ensureFinanceFolder } from "@/backend/drive-folders";
import { driveConfig } from "@/backend/drive-config";
import { directionValue, financeDate, financeDescription, rupiah } from "@/backend/finance-input";
import { requireUploadableFile } from "@/backend/document-input";
import { optionalText } from "@/backend/member-profile";

export type FinanceActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshFinance() {
  updateTag("finance"); updateTag("dashboard");
  revalidatePath("/finance");
}

async function log(actorId: string, action: string, entityId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "finance", entity_id: entityId });
}

/** Bukti hanya diunggah bila Drive memang terkonfigurasi; tanpa itu transaksi
 *  tetap boleh dicatat, sebab mencatat uang lebih penting daripada lampirannya. */
async function uploadProof(form: FormData, periodName: string) {
  const file = form.get("proof");
  if (!(file instanceof File) || !file.size) return null;
  if (!driveConfig().configured) throw new Error("Google Drive belum terhubung, jadi bukti belum dapat diunggah. Simpan transaksi tanpa bukti lebih dulu.");
  requireUploadableFile(file.size, file.name);
  const folder = await ensureFinanceFolder(periodName);
  const uploaded = await uploadFile(file, folder);
  return uploaded.id;
}

export async function createTransaction(_: FinanceActionState, form: FormData): Promise<FinanceActionState> {
  let proofId: string | null = null;
  try {
    const actor = await requirePermission("finance.manage");
    const period = await requireActivePeriod();
    const values = {
      direction: directionValue(field(form, "direction")),
      amount: rupiah(field(form, "amount")),
      occurred_on: financeDate(field(form, "occurred_on")),
      description: financeDescription(field(form, "description")),
      note: optionalText(field(form, "note"), 300),
      category_id: field(form, "category_id").trim() || null,
    };

    proofId = await uploadProof(form, period.name);
    const { data, error } = await supabaseAdmin.from("finance_transactions")
      .insert({ ...values, period_id: period.id, recorded_by: actor.id, proof_drive_file_id: proofId })
      .select("id").single();
    if (error) throw new Error(error.message);

    await log(actor.id, `Mencatat kas ${values.direction === "in" ? "masuk" : "keluar"}: ${values.description}`, data.id);
    refreshFinance();
    return { message: "Transaksi tercatat." };
  } catch (error) {
    // Berkas yang sudah naik dihapus kembali agar Drive tidak menyimpan bukti
    // yatim yang tidak tertaut ke transaksi mana pun.
    if (proofId) await deleteDriveFile(proofId).catch(() => undefined);
    return { error: error instanceof Error ? error.message : "Transaksi gagal dicatat" };
  }
}

export async function deleteTransaction(_: FinanceActionState, form: FormData): Promise<FinanceActionState> {
  try {
    const actor = await requirePermission("finance.manage");
    const id = field(form, "transaction_id").trim();
    if (!id) throw new Error("Transaksi tidak dikenali");
    const { data: row, error: readError } = await supabaseAdmin.from("finance_transactions").select("description,proof_drive_file_id").eq("id", id).single();
    if (readError) throw new Error(readError.message);

    // Iuran yang tertaut dilepas, bukan ikut terhapus: pembayarannya tetap
    // terjadi meski pencatatan kasnya dikoreksi.
    const { count } = await supabaseAdmin.from("member_dues").select("*", { count: "exact", head: true }).eq("transaction_id", id);
    if (count && field(form, "confirmation").trim() !== "HAPUS") {
      throw new Error(`Transaksi ini tertaut ke ${count} catatan iuran. Ketik HAPUS untuk melanjutkan; catatan iurannya tetap tersimpan.`);
    }

    const { error } = await supabaseAdmin.from("finance_transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    if (row.proof_drive_file_id) await deleteDriveFile(row.proof_drive_file_id).catch(() => undefined);

    await log(actor.id, `Menghapus transaksi: ${row.description}`, id);
    refreshFinance();
    return { message: "Transaksi dihapus." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Transaksi gagal dihapus" }; }
}

export async function recordDues(_: FinanceActionState, form: FormData): Promise<FinanceActionState> {
  try {
    const actor = await requirePermission("finance.manage");
    const period = await requireActivePeriod();
    const members = form.getAll("member_ids").map(String).filter(Boolean);
    if (!members.length) throw new Error("Pilih setidaknya satu anggota");

    const perOrang = rupiah(field(form, "amount"), "Nominal per anggota");
    const paidOn = financeDate(field(form, "paid_on"), "Tanggal bayar");
    const note = optionalText(field(form, "note"), 300);

    const { data: kategori } = await supabaseAdmin.from("categories").select("id").eq("type", "finance").eq("name", "Iuran Anggota").maybeSingle();
    const { data: profiles } = await supabaseAdmin.from("profiles").select("full_name").in("id", members);
    const uraian = members.length === 1
      ? `Iuran ${profiles?.[0]?.full_name || "anggota"}`
      : `Iuran ${members.length} anggota`;

    // Satu pembayaran tunai mencakup seluruh anggota yang dipilih, persis
    // kebiasaan lama "480.000 untuk 2 orang" - bedanya kini tercatat siapa saja.
    const { data: transaksi, error: transaksiError } = await supabaseAdmin.from("finance_transactions").insert({
      period_id: period.id, category_id: kategori?.id || null, direction: "in",
      amount: perOrang * members.length, occurred_on: paidOn,
      description: uraian, note, recorded_by: actor.id,
    }).select("id").single();
    if (transaksiError) throw new Error(transaksiError.message);

    const { error: duesError } = await supabaseAdmin.from("member_dues").insert(
      members.map(memberId => ({ period_id: period.id, member_id: memberId, transaction_id: transaksi.id, amount: perOrang, paid_on: paidOn, note, recorded_by: actor.id }))
    );
    if (duesError) {
      await supabaseAdmin.from("finance_transactions").delete().eq("id", transaksi.id);
      throw new Error(duesError.message);
    }

    await log(actor.id, `Mencatat iuran ${members.length} anggota`, transaksi.id);
    refreshFinance();
    return { message: `Iuran ${members.length} anggota tercatat.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Iuran gagal dicatat" }; }
}

export async function setDuesTarget(_: FinanceActionState, form: FormData): Promise<FinanceActionState> {
  try {
    const actor = await requirePermission("finance.manage");
    const period = await requireActivePeriod();
    const target = rupiah(field(form, "dues_target"), "Target iuran");
    const { error } = await supabaseAdmin.from("periods").update({ dues_target: target }).eq("id", period.id);
    if (error) throw new Error(error.message);
    await log(actor.id, "Mengubah target iuran periode", period.id);
    updateTag("periods"); refreshFinance();
    return { message: "Target iuran diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Target iuran gagal diperbarui" }; }
}
