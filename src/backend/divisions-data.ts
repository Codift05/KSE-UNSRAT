import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type DivisionMember = { id: string; name: string };

export type DivisionRow = {
  id: string;
  name: string;
  description: string;
  coordinatorId: string;
  coordinatorName: string;
  members: DivisionMember[];
  programCount: number;
};

const loadDivisionRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  if (!period) return { divisions: [] as DivisionRow[], candidates: [] as DivisionMember[], periodName: "" };

  const [{ data: divisions, error }, { data: profiles }, { data: assignments }, { data: programs }] = await Promise.all([
    supabaseAdmin.from("divisions").select("id,name,description,coordinator_id").eq("period_id", period.id).order("name"),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
    supabaseAdmin.from("division_members").select("division_id,member_id").limit(2000),
    supabaseAdmin.from("programs").select("division_id").eq("period_id", period.id).limit(1000),
  ]);
  if (error) throw new Error(`Gagal memuat divisi: ${error.message}`);

  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const divisionIds = new Set((divisions || []).map(division => division.id));

  const membersByDivision = new Map<string, DivisionMember[]>();
  for (const row of assignments || []) {
    if (!divisionIds.has(row.division_id)) continue;
    membersByDivision.set(row.division_id, [...(membersByDivision.get(row.division_id) || []), { id: row.member_id, name: nameById.get(row.member_id) || "Tanpa nama" }]);
  }

  const programsByDivision = (programs || []).reduce<Record<string, number>>((total, row) => row.division_id ? { ...total, [row.division_id]: (total[row.division_id] || 0) + 1 } : total, {});

  return {
    periodName: period.name,
    divisions: (divisions || []).map(division => ({
      id: division.id,
      name: division.name,
      description: division.description || "",
      coordinatorId: division.coordinator_id || "",
      coordinatorName: division.coordinator_id ? nameById.get(division.coordinator_id) || "Tanpa nama" : "Belum ditetapkan",
      members: (membersByDivision.get(division.id) || []).sort((a, b) => a.name.localeCompare(b.name)),
      programCount: programsByDivision[division.id] || 0,
    })),
    // Anggota pindah dan alumni tidak ditawarkan sebagai kandidat baru, tetapi
    // tetap tampil bila sudah terlanjur terdaftar pada sebuah divisi.
    candidates: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
  };
}, ["divisions"], { revalidate: 30, tags: ["divisions", "members", "profiles"] });

export async function loadDivisions() {
  await requirePermission("member.view");
  const { divisions, candidates, periodName } = await loadDivisionRows();
  const assigned = new Set(divisions.flatMap(division => division.members.map(member => member.id)));
  return {
    divisions,
    candidates,
    periodName,
    memberCount: assigned.size,
    unassignedCount: candidates.filter(candidate => !assigned.has(candidate.id)).length,
  };
}
