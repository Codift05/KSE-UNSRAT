import Image from "next/image";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { requestPasswordReset } from "@/app/login/actions";
import { SubmitButton } from "@/frontend/components/submit-button";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return <main className="login-page"><section className="login-card">
      <div className="login-logo"><Image src="/pskse-logo-transparent.webp" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
    <div className="login-heading"><span><EnvelopeSimple size={18} /></span><div><h1>Reset password</h1><p>Masukkan username kamu. Tautan pemulihan dikirim ke email yang terdaftar pada akun itu.</p></div></div>
    {sent ? <div className="form-success" role="status">Bila username itu terdaftar dan punya email asli, tautan pemulihan sudah dikirim. Periksa inbox dan folder spam. Akun yang belum punya email asli perlu diatur ulang oleh pengurus.</div> : <form action={requestPasswordReset}><label htmlFor="identifier">Username</label><input id="identifier" name="identifier" type="text" autoComplete="username" required />{error && <p className="form-error" role="alert">{error}</p>}<SubmitButton idle="Kirim tautan" pending="Mengirim..." /></form>}
    <Link className="forgot-link" href="/login">Kembali ke login</Link>
  </section></main>;
}
