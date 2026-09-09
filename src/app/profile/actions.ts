"use server";
import { revalidatePath, updateTag } from "next/cache";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { memberName, memberYear, optionalText } from "@/backend/member-profile";

type ProfileActionState = { message?: string; error?: string };

export async function updateProfile(_: ProfileActionState, form: FormData): Promise<ProfileActionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi tidak valid");
    const value = (key: string) => String(form.get(key) || "");
    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: memberName(value("full_name")),
      phone: optionalText(value("phone"), 30),
      faculty: optionalText(value("faculty")),
      study_program: optionalText(value("study_program")),
      cohort_year: memberYear(value("cohort_year"), "Angkatan"),
      kse_entry_year: memberYear(value("kse_entry_year"), "Tahun masuk KSE"),
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) throw new Error(error.message);
    updateTag("profiles");
    updateTag("members");
    revalidatePath("/profile");
    return { message: "Profil berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Profil gagal diperbarui" }; }
}
