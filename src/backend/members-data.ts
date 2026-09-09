import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { memberStatusLabel } from "@/backend/attendance-status";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  faculty: string;
  studyProgram: string;
  cohortYear: string;
  kseEntryYear: string;
  status: string;
  statusLabel: string;
  divisionIds: string[];
  divisionLabel: string;
};

export type DivisionOption = { id: string; name: string };

const text = (value: unknown) => value === null || value === undefined ? "" : String(value);

const loadMemberRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();

  const [{ data: profiles, error }, { data: divisions }, { data: assignments }, { data: users }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,full_name,phone,faculty,study_program,cohort_year,kse_entry_year,member_status").order("full_name").limit(500),
    period ? supabaseAdmin.from("divisions").select("id,name").eq("period_id", period.id).order("name") : Promise.resolve({ data: [] as DivisionOption[] }),
    supabaseAdmin.from("division_members").select("division_id,member_id").limit(2000),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);
  if (error) throw new Error(`Gagal memuat anggota: ${error.message}`);

  const divisionOptions = (divisions || []) as DivisionOption[];
  const divisionNameById = new Map(divisionOptions.map(division => [division.id, division.name]));
  const emailById = new Map((users?.users || []).map(user => [user.id, user.email || ""]));

  // Hanya divisi pada periode aktif yang ditampilkan; penugasan periode lama
  // tetap tersimpan di database tetapi bukan konteks kerja harian.
  const divisionsByMember = new Map<string, string[]>();
  for (const row of assignments || []) {
    if (!divisionNameById.has(row.division_id)) continue;
    divisionsByMember.set(row.member_id, [...(divisionsByMember.get(row.member_id) || []), row.division_id]);
  }

  const members: MemberRow[] = (profiles || []).map(profile => {
    const divisionIds = divisionsByMember.get(profile.id) || [];
    return {
      id: profile.id,
      name: profile.full_name,
      email: emailById.get(profile.id) || "-",
      phone: text(profile.phone),
      faculty: text(profile.faculty),
      studyProgram: text(profile.study_program),
      cohortYear: text(profile.cohort_year),
      kseEntryYear: text(profile.kse_entry_year),
      status: profile.member_status,
      statusLabel: memberStatusLabel(profile.member_status),
      divisionIds,
      divisionLabel: divisionIds.map(id => divisionNameById.get(id)).filter(Boolean).join(", ") || "Belum ditetapkan",
    };
  });

  return { members, divisions: divisionOptions, periodName: period?.name || "" };
}, ["members"], { revalidate: 30, tags: ["members", "profiles"] });

export async function loadMembers() {
  await requirePermission("member.view");
  const { members, divisions, periodName } = await loadMemberRows();
  return {
    members,
    divisions,
    periodName,
    activeCount: members.filter(member => member.status === "active").length,
    alumniCount: members.filter(member => member.status === "alumni").length,
    unassignedCount: members.filter(member => member.status === "active" && !member.divisionIds.length).length,
  };
}
