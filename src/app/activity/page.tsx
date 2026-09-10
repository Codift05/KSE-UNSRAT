import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { ActivityView } from "@/frontend/components/activity-view";
import { loadActivity } from "@/backend/activity-data";
import { loadProfile } from "@/backend/profile-data";

export default async function ActivityPage() {
  const [profile, data] = await Promise.all([loadProfile(), loadActivity()]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<ActivityView {...data} />} />;
}
