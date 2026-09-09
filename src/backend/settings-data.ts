import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { permissionGroup, rootPermission } from "@/backend/permission-group";

export type PermissionItem = { id: string; key: string; description: string; group: string };
export type RoleRow = { id: string; name: string; description: string; permissionIds: string[]; memberCount: number; grantsRoot: boolean };
export type MemberRoleRow = { id: string; name: string; roleIds: string[]; roleLabel: string };

const loadSettingsRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();

  const [{ data: roles, error }, { data: permissions }, { data: rolePermissions }, { data: userRoles }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("roles").select("id,name,description").order("name"),
    supabaseAdmin.from("permissions").select("id,key,description").order("key"),
    supabaseAdmin.from("role_permissions").select("role_id,permission_id"),
    period ? supabaseAdmin.from("user_roles").select("user_id,role_id").eq("period_id", period.id) : Promise.resolve({ data: [] as { user_id: string; role_id: string }[] }),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
  ]);
  if (error) throw new Error(`Gagal memuat pengaturan: ${error.message}`);

  const permissionById = new Map((permissions || []).map(permission => [permission.id, permission]));
  const permissionsByRole = new Map<string, string[]>();
  for (const row of rolePermissions || []) permissionsByRole.set(row.role_id, [...(permissionsByRole.get(row.role_id) || []), row.permission_id]);

  const rolesByUser = new Map<string, string[]>();
  const usersByRole = new Map<string, number>();
  for (const row of userRoles || []) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) || []), row.role_id]);
    usersByRole.set(row.role_id, (usersByRole.get(row.role_id) || 0) + 1);
  }

  const roleRows: RoleRow[] = (roles || []).map(role => {
    const permissionIds = permissionsByRole.get(role.id) || [];
    return {
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissionIds,
      memberCount: usersByRole.get(role.id) || 0,
      grantsRoot: permissionIds.some(id => permissionById.get(id)?.key === rootPermission),
    };
  });
  const roleNameById = new Map(roleRows.map(role => [role.id, role.name]));

  return {
    periodName: period?.name || "",
    roles: roleRows,
    permissions: (permissions || []).map(permission => ({ id: permission.id, key: permission.key, description: permission.description || "", group: permissionGroup(permission.key).label })),
    members: (profiles || []).filter(profile => profile.member_status === "active").map(profile => {
      const roleIds = rolesByUser.get(profile.id) || [];
      return { id: profile.id, name: profile.full_name, roleIds, roleLabel: roleIds.map(id => roleNameById.get(id)).filter(Boolean).join(", ") || "Tanpa role" };
    }),
  };
}, ["settings"], { revalidate: 30, tags: ["settings", "members", "periods"] });

export async function loadSettings() {
  await requirePermission(rootPermission);
  const data = await loadSettingsRows();
  return {
    ...data,
    withoutRoleCount: data.members.filter(member => !member.roleIds.length).length,
    rootHolderCount: data.members.filter(member => member.roleIds.some(id => data.roles.find(role => role.id === id)?.grantsRoot)).length,
  };
}
