import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { FinanceView } from "@/frontend/components/finance-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadFinance } from "@/backend/finance-data";
import { loadProfile } from "@/backend/profile-data";
import { driveConfig } from "@/backend/drive-config";

export default async function FinancePage() {
  const profile = await loadProfile();
  const shell = { accountName: profile.fullName, accountRole: profile.roleLabel, permissions: profile.permissions };
  if (!(await hasPermission("finance.view"))) {
    return <DashboardShell {...shell} content={<AccessNotice title="Keuangan" description="Kas organisasi dan iuran anggota." reason="Kamu memerlukan izin finance.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  return <DashboardShell {...shell} content={<FinanceView {...await loadFinance()} driveConfigured={driveConfig().configured} />} />;
}
