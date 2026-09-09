import { loadProfile } from "@/backend/profile-data";
import { loadSelfAttendance } from "@/backend/self-attendance-data";
import { SelfAttendanceView } from "@/frontend/components/self-attendance-view";

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [data, profile] = await Promise.all([loadSelfAttendance(token), loadProfile()]);
  return <SelfAttendanceView token={token} name={profile.fullName} data={data} />;
}
