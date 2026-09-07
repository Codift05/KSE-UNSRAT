import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { loadDocuments } from "@/lib/dashboard-data";

export default async function DocumentsPage() {
  await requireUser();
  const documents = await loadDocuments();
  return <DashboardShell documentRows={documents} />;
}
