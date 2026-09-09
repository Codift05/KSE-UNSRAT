import "server-only";
import { unstable_cache } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { periodStatus, type PeriodStatus } from "@/backend/period-status";

export type PeriodRow = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  rangeLabel: string;
  status: PeriodStatus;
  managementCount: number;
  divisionCount: number;
};

const day = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const formatDate = (value: string) => day.format(new Date(`${value}T00:00:00`));

const loadPeriodRows = unstable_cache(async (): Promise<PeriodRow[]> => {
  const [{ data: periods, error }, { data: management }, { data: divisions }] = await Promise.all([
    supabaseAdmin.from("periods").select("id,name,starts_on,ends_on,is_active,archived_at").order("starts_on", { ascending: false }).limit(100),
    supabaseAdmin.from("management_members").select("period_id").limit(1000),
    supabaseAdmin.from("divisions").select("period_id").limit(1000),
  ]);
  if (error) throw new Error(`Gagal memuat periode: ${error.message}`);

  const tally = (rows: { period_id: string }[] | null) => (rows || []).reduce<Record<string, number>>((total, row) => ({ ...total, [row.period_id]: (total[row.period_id] || 0) + 1 }), {});
  const managementByPeriod = tally(management);
  const divisionsByPeriod = tally(divisions);

  return (periods || []).map(period => ({
    id: period.id,
    name: period.name,
    startsOn: period.starts_on,
    endsOn: period.ends_on,
    rangeLabel: `${formatDate(period.starts_on)} – ${formatDate(period.ends_on)}`,
    status: periodStatus(period.is_active, period.archived_at),
    managementCount: managementByPeriod[period.id] || 0,
    divisionCount: divisionsByPeriod[period.id] || 0,
  }));
}, ["periods"], { revalidate: 30, tags: ["periods"] });

export async function loadPeriods() {
  await requirePermission("member.view");
  const periods = await loadPeriodRows();
  return {
    periods,
    activeName: periods.find(period => period.status === "Aktif")?.name || "Belum ditetapkan",
    archivedCount: periods.filter(period => period.status === "Diarsipkan").length,
  };
}
