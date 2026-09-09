import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { SettingsView } from "@/frontend/components/settings-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadSettings } from "@/backend/settings-data";
import { loadProfile } from "@/backend/profile-data";

export default async function SettingsPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("system.manage"))) {
    return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} content={<AccessNotice title="Pengaturan" description="Konfigurasi akses, role, dan permission organisasi." reason="Hanya pemegang izin system.manage yang dapat membuka pengaturan." />} />;
  }
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} content={<SettingsView {...await loadSettings()} />} />;
}
