import { DashboardShell } from "@/components/dashboard-shell";
import { loadDocuments } from "@/lib/dashboard-data";

export default async function DocumentsPage() {
  const documents = await loadDocuments();
  return <DashboardShell documentRows={documents} />;
}
