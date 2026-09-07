import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { loadDocuments } from "@/backend/dashboard-data";
import { loadProfile } from "@/backend/profile-data";

export default async function DocumentsPage() {
  const [documents, profile] = await Promise.all([loadDocuments(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} documentRows={documents} />;
}
