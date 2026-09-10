import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { ProfileForm } from "@/frontend/components/profile-form";
import { loadProfile } from "@/backend/profile-data";

export default async function ProfilePage() { const profile = await loadProfile(); return <DashboardShell accountName={profile.fullName} accountRole={profile.roleLabel} permissions={profile.permissions} content={<ProfileForm profile={profile} />} />; }
