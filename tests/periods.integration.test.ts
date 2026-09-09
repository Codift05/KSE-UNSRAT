import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { beginSuite, createTestPeriod, db, endSuite } from "./helpers.ts";

// Wajib: mengembalikan periode aktif yang sebenarnya setelah test selesai.
before(beginSuite);
after(endSuite);

test("set_active_period menyisakan tepat satu periode aktif", async () => {
  const a = await createTestPeriod("periode-a");
  const b = await createTestPeriod("periode-b");

  const { error: firstError } = await db.rpc("set_active_period", { target_period_id: a.id });
  assert.equal(firstError, null, String(firstError?.message));
  const { count: afterFirst } = await db.from("periods").select("*", { count: "exact", head: true }).eq("is_active", true);
  assert.equal(afterFirst, 1, "hanya satu periode boleh aktif setelah aktivasi pertama");

  // Mengaktifkan periode lain harus memindahkan status, bukan menambah baris aktif.
  const { error: secondError } = await db.rpc("set_active_period", { target_period_id: b.id });
  assert.equal(secondError, null, String(secondError?.message));
  const { data: active } = await db.from("periods").select("id").eq("is_active", true);
  assert.equal(active?.length, 1, "aktivasi kedua tidak boleh menyisakan dua periode aktif");
  assert.equal(active?.[0].id, b.id, "periode yang baru diaktifkan harus menjadi satu-satunya yang aktif");
});

test("indeks periods_one_active menolak dua periode aktif sekaligus", async () => {
  const a = await createTestPeriod("bentrok-a");
  await db.rpc("set_active_period", { target_period_id: a.id });
  const b = await createTestPeriod("bentrok-b");

  // Menulis langsung tanpa fungsi harus ditolak database, bukan diam-diam lolos.
  const { error } = await db.from("periods").update({ is_active: true }).eq("id", b.id);
  assert.notEqual(error, null, "database harus menolak periode aktif kedua");
  assert.match(`${error?.message} ${error?.code}`, /23505|duplicate|unique/i);
});

test("set_active_period menolak periode yang tidak ada", async () => {
  const { error } = await db.rpc("set_active_period", { target_period_id: "00000000-0000-0000-0000-000000000000" });
  assert.notEqual(error, null, "periode tidak dikenal harus ditolak");
  assert.match(String(error?.message), /tidak ditemukan/i);
});

test("menghapus periode ikut menghapus divisi di dalamnya", async () => {
  const period = await createTestPeriod("cascade");
  const { data: division } = await db.from("divisions").insert({ period_id: period.id, name: "Divisi Uji" }).select("id").single();
  assert.ok(division?.id);

  await db.from("periods").delete().eq("id", period.id);
  const { count } = await db.from("divisions").select("*", { count: "exact", head: true }).eq("id", division!.id);
  assert.equal(count, 0, "divisi harus ikut terhapus mengikuti on delete cascade");
});
