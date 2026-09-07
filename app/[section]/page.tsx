import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { loadSectionRows } from "@/lib/section-data";

const sections = new Set(["members", "management", "divisions", "periods", "programs", "tasks", "calendar", "inventory", "activity", "settings"]);

export function generateStaticParams() {
  return [...sections].map((section) => ({ section }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  await requireUser();
  const rows = await loadSectionRows(section);
  return <DashboardShell moduleRows={rows} />;
}
