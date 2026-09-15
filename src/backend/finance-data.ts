import "server-only";
import { unstable_cache } from "next/cache";
import { currentUserId, hasPermission, requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { organizationTimeZone } from "@/backend/time-format";
import { directionLabel, duesStatus, formatRupiah, runningBalance } from "@/backend/finance-input";

export type TransactionRow = {
  id: string;
  occurredOn: string;
  dateLabel: string;
  direction: string;
  directionLabel: string;
  amount: number;
  amountLabel: string;
  categoryId: string;
  categoryName: string;
  description: string;
  note: string;
  recordedBy: string;
  proofFileId: string;
  proofLink: string;
};

export type DuesRow = {
  memberId: string;
  name: string;
  paid: number;
  paidLabel: string;
  outstanding: number;
  outstandingLabel: string;
  status: string;
  settled: boolean;
  lastPaidLabel: string;
};

export type Option = { id: string; name: string };

const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const format = (value: string) => dateLabel.format(new Date(`${value}T00:00:00`));
const monthKey = (value: string) => value.slice(0, 7);
const currentMonth = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: organizationTimeZone }).format(new Date()).slice(0, 7);

const loadFinanceRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name,dues_target").eq("is_active", true).maybeSingle();
  if (!period) return { periodName: "", duesTarget: 0, transactions: [] as TransactionRow[], dues: [] as DuesRow[], categories: [] as Option[], members: [] as Option[] };

  const [{ data: transactions, error }, { data: dues }, { data: categories }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("finance_transactions").select("id,occurred_on,direction,amount,category_id,description,note,proof_drive_file_id,recorded_by").eq("period_id", period.id).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("member_dues").select("member_id,amount,paid_on").eq("period_id", period.id).limit(2000),
    supabaseAdmin.from("categories").select("id,name").eq("type", "finance").order("name"),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
  ]);
  if (error) throw new Error(`Gagal memuat keuangan: ${error.message}`);

  const categoryNameById = new Map((categories || []).map(category => [category.id, category.name]));
  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const target = Number(period.dues_target);

  const paidByMember = new Map<string, { total: number; last: string }>();
  for (const row of dues || []) {
    const previous = paidByMember.get(row.member_id) || { total: 0, last: "" };
    paidByMember.set(row.member_id, { total: previous.total + Number(row.amount), last: row.paid_on > previous.last ? row.paid_on : previous.last });
  }

  return {
    periodName: period.name,
    duesTarget: target,
    categories: (categories || []).map(category => ({ id: category.id, name: category.name })),
    members: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
    transactions: (transactions || []).map(row => ({
      id: row.id,
      occurredOn: row.occurred_on,
      dateLabel: format(row.occurred_on),
      direction: row.direction,
      directionLabel: directionLabel(row.direction),
      amount: Number(row.amount),
      amountLabel: formatRupiah(Number(row.amount)),
      categoryId: row.category_id || "",
      categoryName: row.category_id ? categoryNameById.get(row.category_id) || "Kategori terhapus" : "Tanpa kategori",
      description: row.description,
      note: row.note || "",
      recordedBy: row.recorded_by ? nameById.get(row.recorded_by) || "Pengguna terhapus" : "Sistem",
      proofFileId: row.proof_drive_file_id || "",
      proofLink: row.proof_drive_file_id ? `https://drive.google.com/file/d/${row.proof_drive_file_id}/view` : "",
    })),
    dues: (profiles || []).filter(profile => profile.member_status === "active").map(profile => {
      const paid = paidByMember.get(profile.id) || { total: 0, last: "" };
      const status = duesStatus(paid.total, target);
      return {
        memberId: profile.id,
        name: profile.full_name,
        paid: paid.total,
        paidLabel: formatRupiah(paid.total),
        outstanding: status.outstanding,
        outstandingLabel: status.outstanding ? formatRupiah(status.outstanding) : "-",
        status: status.label,
        settled: status.settled,
        lastPaidLabel: paid.last ? format(paid.last) : "-",
      };
    }),
  };
}, ["finance"], { revalidate: 30, tags: ["finance", "members", "periods"] });

export async function loadFinance() {
  await requirePermission("finance.view");
  const data = await loadFinanceRows();
  const [userId, canManage] = await Promise.all([currentUserId(), hasPermission("finance.manage")]);

  const bulan = currentMonth();
  const bulanIni = data.transactions.filter(row => monthKey(row.occurredOn) === bulan);
  const masuk = (rows: TransactionRow[]) => rows.filter(r => r.direction === "in").reduce((n, r) => n + r.amount, 0);
  const keluar = (rows: TransactionRow[]) => rows.filter(r => r.direction === "out").reduce((n, r) => n + r.amount, 0);

  // Saldo dihitung dari seluruh transaksi setiap kali dibaca, bukan disimpan.
  const saldo = runningBalance(data.transactions);

  return {
    ...data,
    currentUserId: userId,
    canManage,
    saldo,
    saldoLabel: formatRupiah(saldo),
    masukBulanIni: formatRupiah(masuk(bulanIni)),
    keluarBulanIni: formatRupiah(keluar(bulanIni)),
    totalMasukLabel: formatRupiah(masuk(data.transactions)),
    totalKeluarLabel: formatRupiah(keluar(data.transactions)),
    belumLunas: data.dues.filter(row => !row.settled).length,
    tunggakanLabel: formatRupiah(data.dues.reduce((n, row) => n + row.outstanding, 0)),
  };
}
