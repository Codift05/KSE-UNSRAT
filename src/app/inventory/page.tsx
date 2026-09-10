import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { InventoryView } from "@/frontend/components/inventory-view";
import { hasPermission } from "@/backend/authorization";
import { loadInventory } from "@/backend/inventory-data";
import { loadProfile } from "@/backend/profile-data";

export default async function InventoryPage() {
  const [profile, data, canManage, canApprove] = await Promise.all([loadProfile(), loadInventory(), hasPermission("inventory.manage"), hasPermission("inventory.approve")]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<InventoryView {...data} canManage={canManage} canApprove={canApprove} />} />;
}
