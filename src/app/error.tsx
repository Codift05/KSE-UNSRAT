"use client";

import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Dicatat ke konsol server agar galat produksi tetap dapat ditelusuri lewat
    // digest, karena pesan aslinya sengaja disembunyikan Next dari pengguna.
    console.error("Galat halaman:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="notice-page">
      <section className="notice-card">
        <span><WarningCircle size={22} /></span>
        <h1>Halaman gagal dimuat</h1>
        <p>Terjadi kesalahan saat menyiapkan halaman ini. Coba muat ulang; bila terus berulang, sampaikan kode di bawah kepada pengelola sistem.</p>
        {error.digest && <p><code>{error.digest}</code></p>}
        <div className="notice-actions">
          <button className="primary-button" type="button" onClick={reset}>Coba lagi</button>
          <Link className="period-button" href="/">Kembali ke dashboard</Link>
        </div>
      </section>
    </main>
  );
}
