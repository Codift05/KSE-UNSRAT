import Image from "next/image";
import { login } from "./actions";
import Link from "next/link";
import { SubmitButton } from "@/frontend/components/submit-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return <main className="login-page auth-page">
    <section className="auth-layout">
      <div className="auth-brand">
        <div className="auth-logo"><Image src="/pskse-logo-transparent.png" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
        <div className="auth-brand-copy"><h1>Satu ruang untuk<br />gerak yang berdampak.</h1><span>Kelola anggota, program kerja, inventaris, dan arsip Paguyuban KSE Unsrat dalam satu sistem.</span></div>
        <small>Portal internal · Paguyuban KSE Unsrat</small>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="login-heading"><div><h2>Masuk</h2><p>Gunakan akun pengurus KSE Unsrat.</p></div></div>
          <form action={login}>
            <div className="field"><label htmlFor="identifier">Email</label><input id="identifier" name="identifier" type="email" autoComplete="email" required autoFocus /></div>
            <div className="field"><div className="field-label"><label htmlFor="password">Password</label><Link href="/forgot-password">Lupa password?</Link></div><input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} /></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <SubmitButton idle="Masuk" pending="Memeriksa akun..." />
          </form>
          <p className="login-help">Belum memiliki akses? Hubungi Super Admin organisasi.</p>
        </div>
      </div>
    </section>
  </main>;
}
