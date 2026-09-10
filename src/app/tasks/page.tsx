import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { TasksView } from "@/frontend/components/tasks-view";
import { hasPermission } from "@/backend/authorization";
import { loadTasks } from "@/backend/tasks-data";
import { loadProfile } from "@/backend/profile-data";

export default async function TasksPage() {
  const [profile, data, canCreate, canAssign] = await Promise.all([loadProfile(), loadTasks(), hasPermission("task.create"), hasPermission("task.assign")]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<TasksView {...data} canCreate={canCreate} canAssign={canAssign} />} />;
}
