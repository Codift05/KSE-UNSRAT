import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/backend/supabase/admin";

type Row = Record<string, unknown>;

const text = (value: unknown, fallback = "-") => value === null || value === undefined || value === "" ? fallback : String(value);
const date = (value: unknown) => value ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(String(value))) : "-";
const label = (value: unknown) => text(value).replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const tables: Record<string, string> = { members: "profiles", management: "management_members", divisions: "divisions", periods: "periods", programs: "programs", tasks: "tasks", calendar: "events", inventory: "inventory_items", activity: "activity_logs", settings: "settings" };

export const loadSectionRows = unstable_cache(async (section: string): Promise<string[][]> => {
  const table = tables[section];
  if (!table) return [];

  // ponytail: client pagination is capped at 100 rows; use Supabase range() when a module exceeds that.
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(100);
  if (error) throw new Error(`Gagal memuat ${section}: ${error.message}`);

  return (data as Row[]).map(row => formatRow(section, row));
}, ["section-rows"], { revalidate: 30, tags: ["sections"] });

function formatRow(section: string, row: Row): string[] {
  switch (section) {
    case "members": return [text(row.full_name), text(row.study_program), text(row.cohort_year), "Belum ditetapkan", label(row.member_status)];
    case "management": return [text(row.user_id), text(row.position_id), text(row.division_id), text(row.period_id), "Aktif"];
    case "divisions": return [text(row.name), text(row.coordinator_id), "Lihat anggota", "Lihat program", "Aktif"];
    case "periods": return [text(row.name), date(row.starts_on), date(row.ends_on), "Lihat pengurus", row.is_active ? "Aktif" : row.archived_at ? "Diarsipkan" : "Draft"];
    case "programs": return [text(row.name), text(row.division_id), text(row.pic_id), date(row.ends_on), label(row.status)];
    case "tasks": return [text(row.title), text(row.program_id), label(row.priority), date(row.due_on), label(row.status)];
    case "calendar": return [text(row.title), label(row.type), date(row.starts_at), text(row.location), text(row.program_id)];
    case "inventory": return [text(row.code), text(row.name), `${text(row.available_quantity, "0")} dari ${text(row.quantity, "0")}`, label(row.condition), label(row.status)];
    case "activity": return [text(row.actor_id, "Sistem"), text(row.action), `${text(row.entity_type)} ${text(row.entity_id, "")}`.trim(), date(row.created_at), "Tercatat"];
    case "settings": return [text(row.key), "Konfigurasi JSON", date(row.updated_at), text(row.updated_by, "Sistem"), "Aktif"];
    default: return [];
  }
}
