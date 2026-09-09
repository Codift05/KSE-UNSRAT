import "server-only";
import { supabaseAdmin } from "@/backend/supabase/admin";

export async function activePeriod() {
  const { data } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();
  return data;
}

export async function requireActivePeriod() {
  const period = await activePeriod();
  if (!period) throw new Error("Belum ada periode aktif. Aktifkan periode lebih dulu di halaman Periode.");
  return period;
}

// Satu anggota hanya menempati satu divisi dalam satu periode. Penugasan pada
// periode lain sengaja tidak disentuh supaya histori divisi tetap utuh.
export async function assignMemberToDivision(memberId: string, divisionId: string, periodId: string) {
  const { data: divisions, error: readError } = await supabaseAdmin.from("divisions").select("id").eq("period_id", periodId);
  if (readError) throw new Error(readError.message);
  const periodDivisionIds = (divisions || []).map(division => division.id);
  if (divisionId && !periodDivisionIds.includes(divisionId)) throw new Error("Divisi tidak ada pada periode aktif");

  if (periodDivisionIds.length) {
    const { error } = await supabaseAdmin.from("division_members").delete().eq("member_id", memberId).in("division_id", periodDivisionIds);
    if (error) throw new Error(error.message);
  }
  if (divisionId) {
    const { error } = await supabaseAdmin.from("division_members").insert({ member_id: memberId, division_id: divisionId });
    if (error) throw new Error(error.message);
  }
}
