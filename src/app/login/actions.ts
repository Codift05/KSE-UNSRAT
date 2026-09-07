"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/backend/supabase/server";

const accountEmails: Record<string, string> = {
  miftah: process.env.AUTH_MIFTAH_EMAIL || "",
};

export async function login(formData: FormData) {
  const identifier = String(formData.get("identifier") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const email = accountEmails[identifier] || identifier;

  if (!identifier || !password) redirect("/login?error=Username%20dan%20password%20wajib%20diisi");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?error=Username%20atau%20password%20tidak%20valid");
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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/update-password`,
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
