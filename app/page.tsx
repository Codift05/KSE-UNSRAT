import { DashboardShell } from "@/components/dashboard-shell";
import { loadDashboard } from "@/lib/dashboard-data";

export default async function Home() {
  const dashboard = await loadDashboard();
  return <DashboardShell dashboard={dashboard} />;
}
