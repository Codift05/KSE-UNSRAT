import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { AttendanceView } from "@/frontend/components/attendance-view";
import { loadAttendance } from "@/backend/attendance-data";
import { loadProfile } from "@/backend/profile-data";

export default async function AttendancePage() {
  const [data, profile] = await Promise.all([loadAttendance(), loadProfile()]);
  return <DashboardShell accountName={profile.fullName} content={<AttendanceView {...data} />} />;
}
