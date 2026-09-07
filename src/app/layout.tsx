import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSE Management System",
  description: "Pusat operasional Paguyuban KSE Unsrat",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={GeistSans.className}>
        <NextTopLoader color="#176b4d" height={3} showSpinner={false} shadow={false} crawlSpeed={180} speed={260} />
        {children}
      </body>
    </html>
  );
}
