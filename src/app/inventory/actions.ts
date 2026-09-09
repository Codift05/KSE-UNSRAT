"use server";

import { revalidatePath, updateTag } from "next/cache";
import { currentUserId, hasPermission, requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { conditionValue, itemCode, itemName, itemStatusValue, quantityValue, requireLoanDates, requireStockWithinTotal } from "@/backend/inventory-input";
import { optionalText } from "@/backend/member-profile";

export type InventoryActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshInventory() {
  updateTag("inventory"); updateTag("dashboard"); updateTag("sections");
  revalidatePath("/inventory"); revalidatePath("/");
}

async function log(actorId: string, action: string, entityId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "inventory", entity_id: entityId });
}

// Constraint available_quantity >= 0 adalah penjaga terakhir di database.
// Pesannya diterjemahkan supaya pengurus tahu apa yang sebenarnya terjadi.
function readable(message: string, code?: string) {
  if (code === "23514" && message.includes("inventory_items")) return "Jumlah tersedia tidak mencukupi untuk peminjaman ini";
  if (code === "23503") return "Barang ini masih terpakai pada riwayat peminjaman dan tidak dapat dihapus";
  if (code === "23505") return "Kode barang sudah dipakai";
  return message;
}

export async function createItem(_: InventoryActionState, form: FormData): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission("inventory.manage");
    const total = quantityValue(field(form, "quantity"), "Jumlah total");
    const { available } = requireStockWithinTotal(quantityValue(field(form, "available_quantity") || String(total), "Jumlah tersedia"), total);
    const name = itemName(field(form, "name"));
    const { data, error } = await supabaseAdmin.from("inventory_items").insert({
      code: itemCode(field(form, "code")), name, quantity: total, available_quantity: available,
      condition: conditionValue(field(form, "condition")), status: itemStatusValue(field(form, "status")),
      location: optionalText(field(form, "location"), 120), notes: optionalText(field(form, "notes"), 300),
    }).select("id").single();
    if (error) throw new Error(readable(error.message, error.code));
    await log(actor.id, `Menambahkan barang ${name}`, data.id);
    refreshInventory();
    return { message: `Barang ${name} ditambahkan.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Barang gagal ditambahkan" }; }
}

export async function updateItem(_: InventoryActionState, form: FormData): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission("inventory.manage");
    const itemId = field(form, "item_id").trim();
    if (!itemId) throw new Error("Barang tidak dikenali");
    const total = quantityValue(field(form, "quantity"), "Jumlah total");
    const { available } = requireStockWithinTotal(quantityValue(field(form, "available_quantity"), "Jumlah tersedia"), total);
    const name = itemName(field(form, "name"));
    const { error } = await supabaseAdmin.from("inventory_items").update({
      code: itemCode(field(form, "code")), name, quantity: total, available_quantity: available,
      condition: conditionValue(field(form, "condition")), status: itemStatusValue(field(form, "status")),
      location: optionalText(field(form, "location"), 120), notes: optionalText(field(form, "notes"), 300),
      updated_at: new Date().toISOString(),
    }).eq("id", itemId);
    if (error) throw new Error(readable(error.message, error.code));
    await log(actor.id, `Mengubah barang ${name}`, itemId);
    refreshInventory();
    return { message: "Barang berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Barang gagal diperbarui" }; }
}

export async function deleteItem(_: InventoryActionState, form: FormData): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission("inventory.manage");
    const itemId = field(form, "item_id").trim();
    if (!itemId) throw new Error("Barang tidak dikenali");
    const { data: item, error: readError } = await supabaseAdmin.from("inventory_items").select("name").eq("id", itemId).single();
    if (readError) throw new Error(readError.message);
    // item_id memakai on delete restrict, jadi riwayat peminjaman menahan
    // penghapusan. Diperiksa lebih dulu agar pesannya jelas.
    const { count } = await supabaseAdmin.from("inventory_transactions").select("*", { count: "exact", head: true }).eq("item_id", itemId);
    if (count) throw new Error(`Barang ini punya ${count} riwayat peminjaman dan tidak dapat dihapus. Tandai sebagai rusak atau hilang bila sudah tidak dipakai.`);
    const { error } = await supabaseAdmin.from("inventory_items").delete().eq("id", itemId);
    if (error) throw new Error(readable(error.message, error.code));
    await log(actor.id, `Menghapus barang ${item.name}`, itemId);
    refreshInventory();
    return { message: `Barang ${item.name} dihapus.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Barang gagal dihapus" }; }
}

export async function requestLoan(_: InventoryActionState, form: FormData): Promise<InventoryActionState> {
  try {
    const userId = await currentUserId();
    const itemId = field(form, "item_id").trim();
    const purpose = optionalText(field(form, "purpose"), 200);
    if (!itemId || !purpose) throw new Error("Barang dan keperluan wajib diisi");
    const quantity = quantityValue(field(form, "quantity"), "Jumlah pinjam");
    if (quantity < 1) throw new Error("Jumlah pinjam minimal 1");
    const { borrowedOn, expectedReturnOn } = requireLoanDates(field(form, "borrowed_on"), field(form, "expected_return_on"));

    const { data: item } = await supabaseAdmin.from("inventory_items").select("name,available_quantity").eq("id", itemId).single();
    if (item && quantity > item.available_quantity) throw new Error(`Hanya tersedia ${item.available_quantity} unit ${item.name}`);

    // borrower_id selalu pemohon sendiri, mengikuti kebijakan RLS
    // "members request inventory" yang mensyaratkan borrower_id = auth.uid().
    const { data, error } = await supabaseAdmin.from("inventory_transactions").insert({
      item_id: itemId, borrower_id: userId, program_id: field(form, "program_id").trim() || null,
      quantity, purpose, borrowed_on: borrowedOn, expected_return_on: expectedReturnOn, status: "waiting_approval",
    }).select("id").single();
    if (error) throw new Error(readable(error.message, error.code));
    await log(userId, `Mengajukan peminjaman ${item?.name || "barang"}`, data.id);
    refreshInventory();
    return { message: "Pengajuan peminjaman terkirim dan menunggu persetujuan." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Pengajuan gagal dikirim" }; }
}

export async function setLoanStatus(form: FormData) {
  const actor = await requirePermission("inventory.approve");
  const loanId = String(form.get("loan_id") || "");
  const status = String(form.get("status") || "");
  const allowed = ["approved", "borrowed", "returned", "completed", "rejected"];
  if (!loanId || !allowed.includes(status)) throw new Error("Perubahan status tidak dikenali");

  const patch: Record<string, unknown> = { status, approved_by: actor.id, updated_at: new Date().toISOString() };
  if (status === "returned") {
    patch.returned_on = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Makassar" }).format(new Date());
    patch.return_condition = "good";
  }
  const { error } = await supabaseAdmin.from("inventory_transactions").update(patch).eq("id", loanId);
  if (error) throw new Error(readable(error.message, error.code));
  await log(actor.id, `Mengubah status peminjaman menjadi ${status}`, loanId);
  refreshInventory();
}

export async function cancelLoan(form: FormData) {
  const userId = await currentUserId();
  const loanId = String(form.get("loan_id") || "");
  if (!loanId) throw new Error("Peminjaman tidak dikenali");
  const { data: loan, error: readError } = await supabaseAdmin.from("inventory_transactions").select("borrower_id,status").eq("id", loanId).single();
  if (readError) throw new Error(readError.message);
  const canApprove = await hasPermission("inventory.approve");
  if (loan.borrower_id !== userId && !canApprove) throw new Error("Kamu hanya dapat membatalkan pengajuanmu sendiri");
  if (loan.status !== "waiting_approval") throw new Error("Hanya pengajuan yang belum disetujui dapat dibatalkan");
  const { error } = await supabaseAdmin.from("inventory_transactions").delete().eq("id", loanId);
  if (error) throw new Error(readable(error.message, error.code));
  await log(userId, "Membatalkan pengajuan peminjaman", loanId);
  refreshInventory();
}
