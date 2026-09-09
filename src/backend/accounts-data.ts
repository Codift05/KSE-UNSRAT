import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { memberStatusLabel } from "@/backend/attendance-status";

export type AccountRow = { id: string; name: string; email: string; memberStatus: string; access: "Aktif" | "Dinonaktifkan"; createdAt: string };


const loadAccountRows = unstable_cache(async (): Promise<AccountRow[]> => {
  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(200),
  ]);
  if (usersError || profilesError) throw new Error(`Gagal memuat akun: ${usersError?.message || profilesError?.message}`);
  const profileById = new Map((profiles || []).map(profile => [profile.id, profile]));
  const rows = (users.users || []).map(user => {
    const profile = profileById.get(user.id);
    const access: AccountRow["access"] = user.banned_until && new Date(user.banned_until) > new Date() ? "Dinonaktifkan" : "Aktif";
    const rawStatus = profile?.member_status || "active";
    return { id: user.id, name: profile?.full_name || String(user.user_metadata.full_name || "Tanpa nama"), email: user.email || "-", memberStatus: memberStatusLabel(rawStatus), access, createdAt: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(user.created_at)) };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}, ["accounts"], { revalidate: 30, tags: ["accounts"] });

export async function loadAccounts() {
  const current = await requirePermission("system.manage");
  return { currentUserId: current.id, accounts: await loadAccountRows() };
}
