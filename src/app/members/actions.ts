"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { memberName, memberStatusValue, memberYear, optionalText } from "@/backend/member-profile";
import { assignMemberToDivision, requireActivePeriod } from "@/backend/division-assignment";

export type MemberActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshMembers() {
  updateTag("members"); updateTag("profiles"); updateTag("accounts"); updateTag("sections");
  revalidatePath("/members");
}

export async function updateMember(_: MemberActionState, form: FormData): Promise<MemberActionState> {
  try {
    const actor = await requirePermission("member.update");
    const memberId = field(form, "member_id").trim();
    if (!memberId) throw new Error("Anggota tidak dikenali");
    const fullName = memberName(field(form, "full_name"));
    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: fullName,
      phone: optionalText(field(form, "phone"), 30),
      faculty: optionalText(field(form, "faculty")),
      study_program: optionalText(field(form, "study_program")),
      cohort_year: memberYear(field(form, "cohort_year"), "Angkatan"),
      kse_entry_year: memberYear(field(form, "kse_entry_year"), "Tahun masuk KSE"),
      member_status: memberStatusValue(field(form, "member_status")),
      updated_at: new Date().toISOString(),
    }).eq("id", memberId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: actor.id, action: `Mengubah data anggota ${fullName}`, entity_type: "member", entity_id: memberId });
    refreshMembers();
    return { message: "Data anggota berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Data anggota gagal diperbarui" }; }
}

export async function setMemberDivision(_: MemberActionState, form: FormData): Promise<MemberActionState> {
  try {
    const actor = await requirePermission("member.update");
    const memberId = field(form, "member_id").trim();
    const divisionId = field(form, "division_id").trim();
    if (!memberId) throw new Error("Anggota tidak dikenali");

    const period = await requireActivePeriod();
    await assignMemberToDivision(memberId, divisionId, period.id);

    await supabaseAdmin.from("activity_logs").insert({ actor_id: actor.id, action: divisionId ? "Menetapkan divisi anggota" : "Melepas divisi anggota", entity_type: "member", entity_id: memberId });
    updateTag("divisions");
    refreshMembers();
    return { message: divisionId ? "Divisi anggota diperbarui." : "Anggota dilepas dari divisi periode aktif." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Divisi gagal diperbarui" }; }
}
