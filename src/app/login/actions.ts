"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/backend/supabase/server";
import { siteUrl } from "@/backend/site-url";

export async function login(formData: FormData) {
  // Sebelumnya ada pemetaan alias nama pengguna ke email lewat variabel
  // lingkungan. Cara itu tidak berskala: setiap pengurus baru menuntut
  // perubahan kode, dan alias diam-diam gagal bila variabelnya tidak diisi.
  // Akun dibuat pengurus dengan email, jadi email pula yang dipakai masuk.
  const email = String(formData.get("identifier") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) redirect("/login?error=Email%20dan%20password%20wajib%20diisi");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?error=Email%20atau%20password%20tidak%20valid");
  redirect("/");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) redirect("/forgot-password?error=Email%20wajib%20diisi");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/update-password`,
  });

  if (error) redirect("/forgot-password?error=Permintaan%20reset%20gagal");
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
