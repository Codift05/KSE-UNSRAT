import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { AccountsView } from "@/frontend/components/accounts-view";
import { loadAccounts } from "@/backend/accounts-data";
import { loadProfile } from "@/backend/profile-data";

export default async function AccountsPage() {
  const [data, profile] = await Promise.all([loadAccounts(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} content={<AccountsView {...data} />} />;
}
