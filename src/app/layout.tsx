import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KSE Management System",
    template: "%s · KSE Management System",
  },
  description: "Pusat operasional Paguyuban KSE Unsrat: kepengurusan, program, kehadiran, inventaris, dan arsip organisasi.",
  applicationName: "KSE Management System",
  openGraph: {
    title: "KSE Management System",
    description: "Pusat operasional Paguyuban KSE Unsrat.",
    siteName: "KSE Management System",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/pskse-logo.png", width: 512, height: 512, alt: "Logo Paguyuban KSE Unsrat" }],
  },
  // Sistem internal organisasi, tidak untuk diindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={GeistSans.className}>
        <a className="skip-link" href="#konten">Lompat ke konten</a>
        <NextTopLoader color="#176b4d" height={3} showSpinner={false} shadow={false} crawlSpeed={180} speed={260} />
        {children}
      </body>
    </html>
  );
}
