import "server-only";
import { unstable_cache } from "next/cache";
import { currentUserId } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { entityTypeLabel, humanizeAction } from "@/backend/activity-format";
import { initialsOf, organizationTimeZone, relativeTimeLabel } from "@/backend/time-format";

export type ActivityRow = {
  id: string;
  actorId: string;
  actorName: string;
  initials: string;
  action: string;
  entityType: string;
  entityLabel: string;
  timeLabel: string;
  stampLabel: string;
};

const stamp = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: organizationTimeZone });
const isoDate = (value: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: organizationTimeZone }).format(value);
// WITA tetap UTC+8 sepanjang tahun, jadi awal hari organisasi dapat disusun
// langsung tanpa perlu tabel zona waktu.
const startOfDayInOrganizationZone = (value: Date) => `${isoDate(value)}T00:00:00+08:00`;

const loadActivityRows = unstable_cache(async () => {
  const now = new Date();
  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("id,actor_id,action,entity_type,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`Gagal memuat log aktivitas: ${error.message}`);

  const actorIds = [...new Set((data || []).map(row => row.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length ? await supabaseAdmin.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] };
  const nameById = new Map((actors || []).map(actor => [actor.id, actor.full_name]));

  const entries: ActivityRow[] = (data || []).map(row => {
    const actorName = row.actor_id ? nameById.get(row.actor_id) || "Pengguna terhapus" : "Sistem";
    return {
      id: String(row.id),
      actorId: row.actor_id || "",
      actorName,
      initials: initialsOf(actorName),
      action: humanizeAction(row.action),
      entityType: row.entity_type,
      entityLabel: entityTypeLabel(row.entity_type),
      timeLabel: relativeTimeLabel(row.created_at, now),
      stampLabel: stamp.format(new Date(row.created_at)),
    };
  });

  const todayStart = startOfDayInOrganizationZone(now);
  const weekStart = startOfDayInOrganizationZone(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const withinToday = (data || []).filter(row => row.created_at >= todayStart);
  const withinWeek = (data || []).filter(row => row.created_at >= weekStart);

  return {
    entries,
    entityTypes: [...new Set(entries.map(entry => entry.entityType))].sort().map(type => ({ type, label: entityTypeLabel(type) })),
    todayCount: withinToday.length,
    weekCount: withinWeek.length,
    activeActors: new Set(withinWeek.map(row => row.actor_id).filter(Boolean)).size,
  };
}, ["activity"], { revalidate: 15, tags: ["activity"] });

export async function loadActivity() {
  // Kebijakan RLS activity_logs mengizinkan seluruh pengguna terautentikasi
  // membaca, jadi halaman ini hanya butuh sesi yang sah.
  await currentUserId();
  return loadActivityRows();
}
