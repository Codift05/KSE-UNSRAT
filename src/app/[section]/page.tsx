import { notFound } from "next/navigation";
import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { loadSectionRows } from "@/backend/section-data";
import { loadProfile } from "@/backend/profile-data";

// members dan periods punya halaman CRUD sendiri; sisanya masih tabel baca-saja generik.
const sections = new Set(["calendar", "inventory", "activity"]);

export function generateStaticParams() {
  return [...sections].map((section) => ({ section }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  const [rows, profile] = await Promise.all([loadSectionRows(section), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} moduleRows={rows} />;
}
