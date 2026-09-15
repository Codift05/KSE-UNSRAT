"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { siteUrl } from "@/backend/site-url";

const GAGAL = "/login?error=Username%20atau%20password%20tidak%20valid";

/** Supabase Auth memakai email sebagai identitas internal, sedangkan anggota
 *  masuk dengan username. Email internal dibentuk dari nomor peserta KSE dan
 *  tidak pernah dilihat siapa pun, jadi menuntut orang mengetiknya hanya
 *  menyulitkan. Pemetaannya diambil dari basis data, bukan ditulis di kode. */
async function emailUntuk(identitas: string) {
  // Alamat email tetap diterima apa adanya; sebagian pengurus terbiasa dengannya.
  if (identitas.includes("@")) return identitas;

  const { data } = await supabaseAdmin.from("profiles").select("id").ilike("username", identitas).maybeSingle();
  if (!data) return null;
  const { data: akun } = await supabaseAdmin.auth.admin.getUserById(data.id);
  return akun.user?.email || null;
}

export async function login(formData: FormData) {
  const identitas = String(formData.get("identifier") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!identitas || !password) redirect("/login?error=Username%20dan%20password%20wajib%20diisi");

  const email = await emailUntuk(identitas);
  // Username yang tidak dikenal dan password yang salah menghasilkan pesan yang
  // sama, supaya halaman ini tidak dapat dipakai menebak siapa saja anggotanya.
  if (!email) redirect(GAGAL);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(GAGAL);
  redirect("/");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const identitas = String(formData.get("identifier") || "").trim().toLowerCase();
  const email = identitas ? await emailUntuk(identitas) : null;
  // Balasan selalu sama, ada atau tidak ada akunnya.
  if (email) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteUrl()}/auth/callback?next=/update-password`,
    });
  }
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) redirect("/update-password?error=Password%20minimal%208%20karakter");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/update-password?error=Password%20gagal%20diperbarui");
  redirect("/?password=updated");
}
