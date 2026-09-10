import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type ProfileData = { fullName: string; phone: string; faculty: string; studyProgram: string; cohortYear: string; kseEntryYear: string; roleLabel: string; permissions: string[] };

const loadProfileById = unstable_cache(async (id: string): Promise<ProfileData> => {
  const [{ data, error }, { data: roles }] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name,phone,faculty,study_program,cohort_year,kse_entry_year").eq("id", id).single(),
    // Peran ditampilkan di kartu akun. Sebelumnya tertulis tetap "Super Admin"
    // untuk semua orang, yang keliru bagi siapa pun selain pemegang peran itu.
    // Izin ikut dimuat agar navigasi hanya menampilkan menu yang benar-benar
    // dapat dibuka; tanpa itu pengguna mengklik menu lalu dibentur penolakan.
    supabaseAdmin.from("user_roles").select("roles(name,role_permissions(permissions(key)))").eq("user_id", id),
  ]);
  if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
  type RoleShape = { name?: string; role_permissions?: { permissions?: { key?: string } | { key?: string }[] }[] };
  const relatedRoles = (roles || []).flatMap(row => {
    const related = (row as { roles?: RoleShape | RoleShape[] }).roles;
    return Array.isArray(related) ? related : related ? [related] : [];
  });
  const roleNames = relatedRoles.map(role => role.name).filter((name): name is string => Boolean(name));
  const permissions = [...new Set(relatedRoles.flatMap(role => (role.role_permissions || []).flatMap(entry => {
    const permission = entry.permissions;
    return Array.isArray(permission) ? permission.map(item => item.key) : [permission?.key];
  })).filter((key): key is string => Boolean(key)))];
  return { fullName: data.full_name, phone: data.phone || "", faculty: data.faculty || "", studyProgram: data.study_program || "", cohortYear: data.cohort_year ? String(data.cohort_year) : "", kseEntryYear: data.kse_entry_year ? String(data.kse_entry_year) : "", roleLabel: roleNames.join(", ") || "Tanpa peran", permissions };
}, ["profile"], { revalidate: 300, tags: ["profiles"] });

export async function loadProfile(): Promise<ProfileData> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) throw new Error("Sesi tidak valid");
  return loadProfileById(data.claims.sub);
}
