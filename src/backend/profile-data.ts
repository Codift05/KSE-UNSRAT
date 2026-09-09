import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type ProfileData = { fullName: string; phone: string; faculty: string; studyProgram: string; cohortYear: string; kseEntryYear: string };

const loadProfileById = unstable_cache(async (id: string): Promise<ProfileData> => {
  const { data, error } = await supabaseAdmin.from("profiles").select("full_name,phone,faculty,study_program,cohort_year,kse_entry_year").eq("id", id).single();
  if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
  return { fullName: data.full_name, phone: data.phone || "", faculty: data.faculty || "", studyProgram: data.study_program || "", cohortYear: data.cohort_year ? String(data.cohort_year) : "", kseEntryYear: data.kse_entry_year ? String(data.kse_entry_year) : "" };
}, ["profile"], { revalidate: 300, tags: ["profiles"] });

export async function loadProfile(): Promise<ProfileData> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) throw new Error("Sesi tidak valid");
  return loadProfileById(data.claims.sub);
}
