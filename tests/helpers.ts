import { createClient } from "@supabase/supabase-js";

// Integration test berjalan terhadap database sungguhan karena trigger,
// constraint, dan cascade hanya hidup di sana — dan justru itu yang tidak dapat
// diuji oleh test fungsi murni.
//
// Karena database ini juga dipakai sungguhan, setiap berkas WAJIB memanggil
// `beginSuite` dan `endSuite`. Keduanya mencatat periode yang sedang aktif lalu
// mengembalikannya, sebab mengaktifkan periode uji menonaktifkan periode nyata
// dan itu membuat seluruh aplikasi kehilangan konteks periodenya.
export const TEST_PREFIX = "__uji__";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Integration test memerlukan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY. Jalankan lewat `npm run test:integration`.");
}

export const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let activePeriodBeforeSuite: string | null = null;

export async function beginSuite() {
  const { data } = await db.from("periods").select("id").eq("is_active", true).maybeSingle();
  activePeriodBeforeSuite = data?.id ?? null;
  await removeTestData();
}

export async function endSuite() {
  await removeTestData();
  if (activePeriodBeforeSuite) {
    const { error } = await db.rpc("set_active_period", { target_period_id: activePeriodBeforeSuite });
    if (error) throw new Error(`Periode aktif gagal dipulihkan setelah test: ${error.message}`);
  }
}

async function removeTestData() {
  await db.from("inventory_transactions").delete().like("purpose", `${TEST_PREFIX}%`);
  await db.from("inventory_items").delete().like("code", "UJI-%");
  await db.from("periods").delete().like("name", `${TEST_PREFIX}%`);
}

export async function anyProfileId() {
  const { data, error } = await db.from("profiles").select("id").limit(1).single();
  if (error) throw new Error(`Butuh minimal satu profil untuk menguji relasi: ${error.message}`);
  return data.id as string;
}

/** Periode uji terpisah dari periode nyata; menghapusnya ikut menghapus divisi,
 *  program, kegiatan, dan dokumen di dalamnya lewat on delete cascade. */
export async function createTestPeriod(label: string) {
  const name = `${TEST_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await db.from("periods")
    .insert({ name, starts_on: "2000-01-01", ends_on: "2000-12-31", is_active: false })
    .select("id,name").single();
  if (error) throw new Error(`Periode uji gagal dibuat: ${error.message}`);
  return data as { id: string; name: string };
}
