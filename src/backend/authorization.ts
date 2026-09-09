import "server-only";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

async function currentUserGrants() {
  const supabase = await createSupabaseServerClient();
  const { data: jwt } = await supabase.auth.getClaims();
  const userId = typeof jwt?.claims.sub === "string" ? jwt.claims.sub : null;
  if (!userId) throw new Error("Sesi tidak valid");

  const { data } = await supabaseAdmin.from("user_roles").select("roles(role_permissions(permissions(key)))").eq("user_id", userId);
  return { userId, grants: JSON.stringify(data) };
}

export async function requirePermission(permission: string) {
  const { userId, grants } = await currentUserGrants();
  if (!grants.includes(`"key":"${permission}"`)) throw new Error("Kamu tidak memiliki izin untuk tindakan ini");
  return { id: userId };
}

export async function hasPermission(permission: string) {
  const { grants } = await currentUserGrants();
  return grants.includes(`"key":"${permission}"`);
}
