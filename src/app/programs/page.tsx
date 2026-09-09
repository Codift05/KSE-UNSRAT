import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { ProgramsView } from "@/frontend/components/programs-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadPrograms } from "@/backend/programs-data";
import { loadProfile } from "@/backend/profile-data";

export default async function ProgramsPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("program.view"))) {
    return <DashboardShell accountName={profile.fullName} content={<AccessNotice title="Semua program" description="Monitor progres, penanggung jawab, dan tenggat program." reason="Kamu memerlukan izin program.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canCreate, canUpdate, canDelete] = await Promise.all([loadPrograms(), hasPermission("program.create"), hasPermission("program.update"), hasPermission("program.delete")]);
  return <DashboardShell accountName={profile.fullName} content={<ProgramsView {...data} canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />} />;
}
