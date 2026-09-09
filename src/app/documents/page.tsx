import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { DocumentsView } from "@/frontend/components/documents-view";
import { loadDocuments } from "@/backend/documents-data";
import { loadProfile } from "@/backend/profile-data";

export default async function DocumentsPage() {
  const [documents, profile] = await Promise.all([loadDocuments(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} content={<DocumentsView {...documents} />} />;
}
