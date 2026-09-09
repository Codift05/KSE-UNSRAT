import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/backend/supabase/admin";

export type DashboardData = { activePrograms: number; pendingTasks: number; upcomingEvents: number; activeMembers: number };
export type DocumentRow = { title: string; category: string; program: string; owner: string; updated: string; status: string };

export const loadDashboard = unstable_cache(async (): Promise<DashboardData> => {
  const today = new Date().toISOString();
  const [programs, tasks, events, members] = await Promise.all([
    supabaseAdmin.from("programs").select("*", { count: "exact", head: true }).in("status", ["planning", "ongoing", "evaluation"]),
    supabaseAdmin.from("tasks").select("*", { count: "exact", head: true }).neq("status", "done"),
    supabaseAdmin.from("events").select("*", { count: "exact", head: true }).gte("starts_at", today),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("member_status", "active"),
  ]);

  return { activePrograms: programs.count || 0, pendingTasks: tasks.count || 0, upcomingEvents: events.count || 0, activeMembers: members.count || 0 };
}, ["dashboard"], { revalidate: 15, tags: ["dashboard"] });

export const loadDocuments = unstable_cache(async (): Promise<DocumentRow[]> => {
  const { data, error } = await supabaseAdmin.from("documents").select("title, created_at, categories(name), programs(name), profiles(full_name)").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`Gagal memuat dokumen: ${error.message}`);

  return (data || []).map((item: Record<string, unknown>) => ({
    title: String(item.title),
    category: relationName(item.categories),
    program: relationName(item.programs, "Organisasi"),
    owner: relationName(item.profiles),
    updated: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(String(item.created_at))),
    status: "Lengkap",
  }));
}, ["documents"], { revalidate: 30, tags: ["documents"] });

function relationName(value: unknown, fallback = "-") {
  if (Array.isArray(value)) return String(value[0]?.name || value[0]?.full_name || fallback);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name || record.full_name || fallback);
  }
  return fallback;
}
