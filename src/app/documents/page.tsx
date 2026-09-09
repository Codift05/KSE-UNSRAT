import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { DocumentsView } from "@/frontend/components/documents-view";
import { loadDocuments } from "@/backend/dashboard-data";
import { loadProfile } from "@/backend/profile-data";
import { driveConfig } from "@/backend/drive-config";

export default async function DocumentsPage() {
  const [documents, profile] = await Promise.all([loadDocuments(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} content={<DocumentsView rows={documents} driveConfigured={driveConfig().configured} />} />;
}
