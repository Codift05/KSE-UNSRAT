import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <main className="notice-page">
      <section className="notice-card">
        <span><Compass size={22} /></span>
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang kamu buka tidak ada di sistem ini. Mungkin tautannya sudah berubah, atau halaman itu memang belum pernah ada.</p>
        <div className="notice-actions">
          <Link className="primary-button" href="/">Kembali ke dashboard</Link>
        </div>
      </section>
    </main>
  );
}
