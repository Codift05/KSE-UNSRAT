import Image from "next/image";
import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { login } from "./actions";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
        <SubmitButton idle="Masuk" pending="Memeriksa akun..." icon />
      </form>
      <Link className="forgot-link" href="/forgot-password">Lupa password?</Link>
      <p className="login-help">Hubungi Super Admin jika belum memiliki akses.</p>
    </section>
  </main>;
}
