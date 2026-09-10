import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { AttendanceView } from "@/frontend/components/attendance-view";
import { AccessNotice } from "@/frontend/components/access-notice";
import { hasPermission } from "@/backend/authorization";
import { loadAttendance } from "@/backend/attendance-data";
import { loadProfile } from "@/backend/profile-data";

export default async function AttendancePage() {
  const profile = await loadProfile();
  const shell = { accountName: profile.fullName, accountRole: profile.roleLabel, permissions: profile.permissions };
  // loadAttendance dibungkus unstable_cache sehingga tidak dapat membaca cookie
  // dan tidak mungkin memeriksa izin sendiri. Penjagaannya diletakkan di sini.
  if (!(await hasPermission("attendance.view"))) {
    return <DashboardShell {...shell} content={<AccessNotice title="Kehadiran & poin" description="Rekap kehadiran dan perolehan poin beswan." reason="Kamu memerlukan izin attendance.view. Hubungi Super Admin untuk mengatur role kamu." />} />;
  }
  return <DashboardShell {...shell} content={<AttendanceView {...await loadAttendance()} />} />;
}
