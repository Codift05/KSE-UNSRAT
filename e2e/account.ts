import { createClient } from "@supabase/supabase-js";

// Akun khusus uji: dibuat sebelum test, dihapus sesudahnya. Memakai akun nyata
// pengurus akan mengotori log aktivitas dan menuntut kata sandinya.
export const TEST_EMAIL = "uji-e2e@kse-management.test";
export const TEST_PASSWORD = "UjiE2E!kse2026";
export const TEST_NAME = "Akun Uji Otomatis";

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Uji browser memerlukan kredensial Supabase pada .env.local");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function findTestUser(db: ReturnType<typeof adminClient>) {
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  return data.users.find(user => user.email === TEST_EMAIL);
}

export async function removeTestAccount() {
  const db = adminClient();
  const existing = await findTestUser(db);
  if (existing) await db.auth.admin.deleteUser(existing.id);
}

export async function createTestAccount() {
  const db = adminClient();
  await removeTestAccount();

  const { data, error } = await db.auth.admin.createUser({
    email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true, user_metadata: { full_name: TEST_NAME },
  });
  if (error || !data.user) throw new Error(`Akun uji gagal dibuat: ${error?.message}`);
  await db.from("profiles").update({ full_name: TEST_NAME, member_status: "active" }).eq("id", data.user.id);

  // Diberi peran pengelola agar seluruh halaman terbuka; tanpa itu sebagian
  // besar halaman hanya menampilkan pemberitahuan izin dan tidak teruji.
  const [{ data: role }, { data: period }] = await Promise.all([
    db.from("roles").select("id").eq("name", "Super Admin").single(),
    db.from("periods").select("id").eq("is_active", true).single(),
  ]);
  if (!role || !period) throw new Error("Butuh peran Super Admin dan satu periode aktif untuk menjalankan uji browser");
  const { error: roleError } = await db.from("user_roles").insert({ user_id: data.user.id, role_id: role.id, period_id: period.id });
  if (roleError) throw new Error(`Peran akun uji gagal ditetapkan: ${roleError.message}`);

  return data.user.id;
}

export const MEMBER_EMAIL = "uji-anggota@kse-management.test";
export const MEMBER_PASSWORD = "UjiAnggota!kse2026";

/** Akun beruang "Anggota" untuk membuktikan pembatasan per peran benar-benar
 *  terasa: menu yang tidak berizin disembunyikan, dan halaman yang tertutup
 *  menolak dengan penjelasan alih-alih melempar galat. */
export async function createMemberAccount() {
  const db = adminClient();
  await removeMemberAccount();

  const { data, error } = await db.auth.admin.createUser({
    email: MEMBER_EMAIL, password: MEMBER_PASSWORD, email_confirm: true, user_metadata: { full_name: "Anggota Uji" },
  });
  if (error || !data.user) throw new Error(`Akun anggota uji gagal dibuat: ${error?.message}`);
  await db.from("profiles").update({ full_name: "Anggota Uji", member_status: "active" }).eq("id", data.user.id);

  const [{ data: role }, { data: period }] = await Promise.all([
    db.from("roles").select("id").eq("name", "Anggota").single(),
    db.from("periods").select("id").eq("is_active", true).single(),
  ]);
  if (!role || !period) throw new Error("Butuh peran Anggota dan periode aktif");
  await db.from("user_roles").insert({ user_id: data.user.id, role_id: role.id, period_id: period.id });
  return data.user.id;
}

export async function removeMemberAccount() {
  const db = adminClient();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = data.users.find(user => user.email === MEMBER_EMAIL);
  if (existing) await db.auth.admin.deleteUser(existing.id);
}
