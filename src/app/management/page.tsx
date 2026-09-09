import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { ManagementView } from "@/frontend/components/management-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadManagement } from "@/backend/management-data";
import { loadProfile } from "@/backend/profile-data";

export default async function ManagementPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("member.view"))) {
    return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} content={<AccessNotice title="Kepengurusan" description="Struktur pengurus pada periode yang sedang aktif." reason="Kamu memerlukan izin member.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canManage] = await Promise.all([loadManagement(), hasPermission("system.manage")]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} content={<ManagementView {...data} canManage={canManage} />} />;
}
