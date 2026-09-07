import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSE Management System",
  description: "Pusat operasional Paguyuban KSE Unsrat",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
