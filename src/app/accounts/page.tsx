import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { AccountsView } from "@/frontend/components/accounts-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadAccounts } from "@/backend/accounts-data";
import { loadProfile } from "@/backend/profile-data";

export default async function AccountsPage() {
  const profile = await loadProfile();
  const shell = { accountName: profile.fullName, accountRole: profile.roleLabel, permissions: profile.permissions };
  // loadAccounts melempar galat bila izin kurang, sehingga tanpa penjagaan ini
  // pengguna biasa melihat layar galat seolah aplikasi rusak.
  if (!(await hasPermission("system.manage"))) {
    return <DashboardShell {...shell} content={<AccessNotice title="Akun beswan" description="Buat dan kelola akses login beswan." reason="Hanya pemegang izin system.manage yang dapat mengelola akun." />} />;
  }
  return <DashboardShell {...shell} content={<AccountsView {...await loadAccounts()} />} />;
}
