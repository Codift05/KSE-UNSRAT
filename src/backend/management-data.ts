import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type PositionRow = { id: string; name: string; sortOrder: number; holderCount: number };
export type ManagementRow = { userId: string; name: string; positionId: string; positionName: string; divisionId: string; divisionName: string; sortOrder: number };
export type Option = { id: string; name: string };

const loadManagementRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  if (!period) return { periodName: "", positions: [] as PositionRow[], management: [] as ManagementRow[], candidates: [] as Option[], divisions: [] as Option[] };

  const [{ data: positions, error }, { data: assignments }, { data: profiles }, { data: divisions }] = await Promise.all([
    supabaseAdmin.from("positions").select("id,name,sort_order").eq("period_id", period.id).order("sort_order").order("name"),
    supabaseAdmin.from("management_members").select("user_id,position_id,division_id").eq("period_id", period.id).limit(500),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
    supabaseAdmin.from("divisions").select("id,name").eq("period_id", period.id).order("name"),
  ]);
  if (error) throw new Error(`Gagal memuat kepengurusan: ${error.message}`);

  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const divisionNameById = new Map((divisions || []).map(division => [division.id, division.name]));
  const positionById = new Map((positions || []).map(position => [position.id, position]));

  const management: ManagementRow[] = (assignments || []).map(row => {
    const position = positionById.get(row.position_id);
    return {
      userId: row.user_id,
      name: nameById.get(row.user_id) || "Tanpa nama",
      positionId: row.position_id,
      positionName: position?.name || "Jabatan terhapus",
      divisionId: row.division_id || "",
      divisionName: row.division_id ? divisionNameById.get(row.division_id) || "Divisi terhapus" : "Inti",
      sortOrder: position?.sort_order ?? 999,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.positionName.localeCompare(b.positionName) || a.name.localeCompare(b.name));

  const holders = (assignments || []).reduce<Record<string, number>>((total, row) => ({ ...total, [row.position_id]: (total[row.position_id] || 0) + 1 }), {});

  return {
    periodName: period.name,
    positions: (positions || []).map(position => ({ id: position.id, name: position.name, sortOrder: position.sort_order, holderCount: holders[position.id] || 0 })),
    management,
    candidates: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
    divisions: (divisions || []).map(division => ({ id: division.id, name: division.name })),
  };
}, ["management"], { revalidate: 30, tags: ["management", "divisions", "members", "profiles"] });

export async function loadManagement() {
  await requirePermission("member.view");
  const data = await loadManagementRows();
  return {
    ...data,
    officerCount: new Set(data.management.map(row => row.userId)).size,
    vacantCount: data.positions.filter(position => !position.holderCount).length,
  };
}
