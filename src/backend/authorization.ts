import "server-only";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

export async function requirePermission(permission: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi tidak valid");

  const { data } = await supabaseAdmin.from("user_roles").select("roles(role_permissions(permissions(key)))").eq("user_id", user.id);
  if (!JSON.stringify(data).includes(`\"key\":\"${permission}\"`)) throw new Error("Kamu tidak memiliki izin untuk tindakan ini");
  return user;
}
