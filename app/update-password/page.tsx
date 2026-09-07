import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePassword } from "@/app/login/actions";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;

  return <main className="login-page"><section className="login-card"><div className="login-heading"><div><h1>Buat password baru</h1><p>Gunakan minimal 8 karakter yang tidak mudah ditebak.</p></div></div><form action={updatePassword}><label htmlFor="password">Password baru</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />{error && <p className="form-error" role="alert">{error}</p>}<button type="submit">Simpan password</button></form></section></main>;
}
