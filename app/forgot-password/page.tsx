import Image from "next/image";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { requestPasswordReset } from "@/app/login/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return <main className="login-page"><section className="login-card">
    <div className="login-logo"><Image src="/pskse-logo.png" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
    <div className="login-heading"><span><EnvelopeSimple size={18} /></span><div><h1>Reset password</h1><p>Kami akan mengirim tautan pemulihan ke email terdaftar.</p></div></div>
    {sent ? <div className="form-success" role="status">Tautan reset sudah dikirim. Periksa inbox dan folder spam.</div> : <form action={requestPasswordReset}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required />{error && <p className="form-error" role="alert">{error}</p>}<button type="submit">Kirim tautan</button></form>}
    <Link className="forgot-link" href="/login">Kembali ke login</Link>
  </section></main>;
}
