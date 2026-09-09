import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { DivisionsView } from "@/frontend/components/divisions-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadDivisions } from "@/backend/divisions-data";
import { loadProfile } from "@/backend/profile-data";

export default async function DivisionsPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("member.view"))) {
    return <DashboardShell accountName={profile.fullName} content={<AccessNotice title="Divisi" description="Pantau koordinator, anggota, dan program setiap divisi." reason="Kamu memerlukan izin member.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canManage] = await Promise.all([loadDivisions(), hasPermission("member.update")]);
  return <DashboardShell accountName={profile.fullName} content={<DivisionsView {...data} canManage={canManage} />} />;
}
