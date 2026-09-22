import type { Metadata } from "next";
import { PublicLanding } from "@/frontend/components/public-landing";

export const metadata: Metadata = {
  title: "Paguyuban KSE Unsrat",
  description: "Ruang bagi Beswan KSE Unsrat untuk berbagi, berkembang, dan membangun jejaring bersama.",
  robots: { index: true, follow: true },
};

export default function Home() {
  return <PublicLanding />;
}
