import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { PeriodsView } from "@/frontend/components/periods-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadPeriods } from "@/backend/periods-data";
import { loadProfile } from "@/backend/profile-data";

export default async function PeriodsPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("member.view"))) {
    return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<AccessNotice title="Periode" description="Kelola masa kepengurusan dan histori organisasi." reason="Kamu memerlukan izin member.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canManage] = await Promise.all([loadPeriods(), hasPermission("system.manage")]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<PeriodsView {...data} canManage={canManage} />} />;
}
