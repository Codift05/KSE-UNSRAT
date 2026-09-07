"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/app/profile/actions";
import type { ProfileData } from "@/backend/profile-data";

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [state, action] = useActionState(updateProfile, {} as { message?: string; error?: string });
  return <div className="content profile-page"><section className="page-heading"><div><h1>Profil saya</h1><span>Perbarui informasi yang tampil pada akun KSE.</span></div></section><section className="panel profile-panel"><form action={action}>
    <label>Nama lengkap<input name="full_name" defaultValue={profile.fullName} required maxLength={100} /></label><label>Nomor telepon<input name="phone" type="tel" defaultValue={profile.phone} /></label><label>Fakultas<input name="faculty" defaultValue={profile.faculty} /></label><label>Program studi<input name="study_program" defaultValue={profile.studyProgram} /></label>
    <div className="profile-years"><label>Angkatan<input name="cohort_year" type="number" min="2000" max="2100" defaultValue={profile.cohortYear} /></label><label>Angkatan KSE<input name="kse_entry_year" type="number" min="2000" max="2100" defaultValue={profile.kseEntryYear} /></label></div>
    {state.message && <p className="inline-message success" role="status">{state.message}</p>}{state.error && <p className="inline-message error" role="alert">{state.error}</p>}<ProfileSubmit />
  </form></section></div>;
}
function ProfileSubmit() { const { pending } = useFormStatus(); return <button className="primary-button" disabled={pending}>{pending ? "Menyimpan..." : "Simpan perubahan"}</button>; }
