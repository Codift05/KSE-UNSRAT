import "server-only";
import { createSupabaseServerClient } from "@/backend/supabase/server";

export type ProfileData = { fullName: string; phone: string; faculty: string; studyProgram: string; cohortYear: string; kseEntryYear: string };

export async function loadProfile(): Promise<ProfileData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi tidak valid");
  const { data, error } = await supabase.from("profiles").select("full_name,phone,faculty,study_program,cohort_year,kse_entry_year").eq("id", user.id).single();
  if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
  return { fullName: data.full_name, phone: data.phone || "", faculty: data.faculty || "", studyProgram: data.study_program || "", cohortYear: data.cohort_year ? String(data.cohort_year) : "", kseEntryYear: data.kse_entry_year ? String(data.kse_entry_year) : "" };
}
