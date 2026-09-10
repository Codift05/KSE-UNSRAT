import "server-only";
import { headers } from "next/headers";

// Tautan reset password dikirim lewat email, jadi harus menunjuk alamat yang
// benar-benar dapat dibuka penerimanya. Mengandalkan NEXT_PUBLIC_SITE_URL saja
// berbahaya: bila lupa diisi saat deploy, tautannya menunjuk localhost dan
// kegagalannya baru ketahuan setelah ada pengguna yang tidak bisa masuk.
export async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!host) throw new Error("Alamat situs tidak dapat ditentukan. Isi NEXT_PUBLIC_SITE_URL.");
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
