import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { anyProfileId, beginSuite, db, endSuite, TEST_PREFIX } from "./helpers.ts";

before(beginSuite);
after(endSuite);

async function createItem(code: string, quantity: number) {
  const { data, error } = await db.from("inventory_items")
    .insert({ code: `UJI-${code}`, name: `Barang ${code}`, quantity, available_quantity: quantity })
    .select("id").single();
  if (error) throw new Error(`Barang uji gagal dibuat: ${error.message}`);
  return data.id as string;
}

async function stock(itemId: string) {
  const { data } = await db.from("inventory_items").select("available_quantity,status").eq("id", itemId).single();
  return data as { available_quantity: number; status: string };
}

async function createLoan(itemId: string, quantity: number, status: string) {
  const { data, error } = await db.from("inventory_transactions").insert({
    item_id: itemId, borrower_id: await anyProfileId(), quantity,
    purpose: `${TEST_PREFIX}peminjaman`, borrowed_on: "2000-01-01", expected_return_on: "2000-01-05", status,
  }).select("id").single();
  return { id: data?.id as string | undefined, error };
}

test("pengajuan belum memotong stok, penyerahan memotong, pengembalian memulihkan", async () => {
  const item = await createItem("ALUR", 3);

  const pending = await createLoan(item, 2, "waiting_approval");
  assert.equal(pending.error, null, String(pending.error?.message));
  assert.equal((await stock(item)).available_quantity, 3, "stok tidak boleh berkurang sebelum barang diserahkan");

  await db.from("inventory_transactions").update({ status: "borrowed" }).eq("id", pending.id!);
  assert.equal((await stock(item)).available_quantity, 1, "stok harus berkurang sebanyak jumlah pinjam saat diserahkan");

  await db.from("inventory_transactions").update({ status: "returned", returned_on: "2000-01-04" }).eq("id", pending.id!);
  assert.equal((await stock(item)).available_quantity, 3, "stok harus pulih penuh setelah dikembalikan");
});

test("status barang berpindah ke dipinjam ketika stok habis dan kembali saat tersedia", async () => {
  const item = await createItem("HABIS", 2);
  const loan = await createLoan(item, 2, "borrowed");
  assert.equal(loan.error, null, String(loan.error?.message));

  const habis = await stock(item);
  assert.equal(habis.available_quantity, 0);
  assert.equal(habis.status, "borrowed", "status barang harus otomatis menjadi dipinjam saat stok nol");

  await db.from("inventory_transactions").update({ status: "returned", returned_on: "2000-01-04" }).eq("id", loan.id!);
  const pulih = await stock(item);
  assert.equal(pulih.available_quantity, 2);
  assert.equal(pulih.status, "available", "status barang harus kembali tersedia setelah dikembalikan");
});

test("database menolak peminjaman melebihi stok tersedia", async () => {
  const item = await createItem("LEBIH", 1);
  const pertama = await createLoan(item, 1, "borrowed");
  assert.equal(pertama.error, null, String(pertama.error?.message));

  // Penjaga terakhir ada di constraint available_quantity >= 0, bukan di aplikasi.
  const kedua = await createLoan(item, 1, "borrowed");
  assert.notEqual(kedua.error, null, "kelebihan pinjam harus ditolak database");
  assert.equal((await stock(item)).available_quantity, 0, "stok tidak boleh menjadi negatif");
});

test("membatalkan peminjaman yang sedang berjalan memulihkan stok", async () => {
  const item = await createItem("BATAL", 4);
  const loan = await createLoan(item, 3, "borrowed");
  assert.equal((await stock(item)).available_quantity, 1);

  await db.from("inventory_transactions").delete().eq("id", loan.id!);
  assert.equal((await stock(item)).available_quantity, 4, "menghapus transaksi berjalan harus mengembalikan stok");
});

test("barang dengan riwayat peminjaman tidak dapat dihapus", async () => {
  const item = await createItem("TAHAN", 1);
  await createLoan(item, 1, "waiting_approval");

  // item_id memakai on delete restrict; aplikasi mengandalkan ini agar riwayat
  // peminjaman tidak lenyap diam-diam bersama barangnya.
  const { error } = await db.from("inventory_items").delete().eq("id", item);
  assert.notEqual(error, null, "penghapusan harus ditahan foreign key");
});
