import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { loadDashboard } from "@/backend/dashboard-data";
import { loadProfile } from "@/backend/profile-data";

export default async function Home() {
  const [dashboard, profile] = await Promise.all([loadDashboard(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} dashboard={dashboard} />;
}
