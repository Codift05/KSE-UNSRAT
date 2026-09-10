import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { CalendarView } from "@/frontend/components/calendar-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadCalendar } from "@/backend/calendar-data";
import { loadProfile } from "@/backend/profile-data";

export default async function CalendarPage() {
  const profile = await loadProfile();
  if (!(await hasPermission("member.view"))) {
    return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<AccessNotice title="Kalender" description="Jadwal rapat, program, tenggat, dan kegiatan internal." reason="Kamu memerlukan izin member.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  const [data, canManage] = await Promise.all([loadCalendar(), hasPermission("program.update")]);
  return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<CalendarView {...data} canManage={canManage} />} />;
}
