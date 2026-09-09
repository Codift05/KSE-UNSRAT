import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { MembersView } from "@/frontend/components/members-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadMembers } from "@/backend/members-data";
import { loadProfile } from "@/backend/profile-data";

export default async function MembersPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("member.view"))) {
    return <DashboardShell accountName={profile.fullName} content={<AccessNotice title="Anggota" description="Kelola data dan status seluruh anggota KSE Unsrat." reason="Kamu memerlukan izin member.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canManage] = await Promise.all([loadMembers(), hasPermission("member.update")]);
  return <DashboardShell accountName={profile.fullName} content={<MembersView {...data} canManage={canManage} />} />;
}
