import Image from "next/image";
import { redirect } from "next/navigation";
import { LockKey, SignIn } from "@phosphor-icons/react/dist/ssr";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { login } from "./actions";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return <main className="login-page">
    <section className="login-card">
      <div className="login-logo"><Image src="/pskse-logo.png" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
      <div className="login-heading"><span><LockKey size={18} /></span><div><h1>Masuk ke KSE</h1><p>Gunakan akun pengurus atau anggota yang terdaftar.</p></div></div>
      <form action={login}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit"><SignIn size={18} weight="bold" />Masuk</button>
      </form>
      <Link className="forgot-link" href="/forgot-password">Lupa password?</Link>
      <p className="login-help">Hubungi Super Admin jika belum memiliki akses.</p>
    </section>
  </main>;
}
