import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { MemberPointsView } from "@/frontend/components/member-points-view";
import { loadMemberPoints } from "@/backend/member-points";
import { loadProfile } from "@/backend/profile-data";

export default async function MemberPointsPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const [data, profile] = await Promise.all([loadMemberPoints(memberId), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<MemberPointsView data={data} />} />;
}
