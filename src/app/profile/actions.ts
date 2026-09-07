"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";

type ProfileActionState = { message?: string; error?: string };

export async function updateProfile(_: ProfileActionState, form: FormData): Promise<ProfileActionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi tidak valid");
    const fullName = String(form.get("full_name") || "").trim();
    if (fullName.length < 2 || fullName.length > 100) throw new Error("Nama harus 2-100 karakter");
    const year = (key: string) => { const value = String(form.get(key) || ""); return value ? Number(value) : null; };
    const { error } = await supabaseAdmin.from("profiles").update({ full_name: fullName, phone: String(form.get("phone") || "").trim() || null, faculty: String(form.get("faculty") || "").trim() || null, study_program: String(form.get("study_program") || "").trim() || null, cohort_year: year("cohort_year"), kse_entry_year: year("kse_entry_year"), updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/profile");
    return { message: "Profil berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Profil gagal diperbarui" }; }
}
