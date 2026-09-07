import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { loadDashboard } from "@/lib/dashboard-data";

export default async function Home() {
  await requireUser();
  const dashboard = await loadDashboard();
  return <DashboardShell dashboard={dashboard} />;
}
