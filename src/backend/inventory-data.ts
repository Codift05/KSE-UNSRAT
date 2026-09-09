import "server-only";
import { unstable_cache } from "next/cache";
import { currentUserId, hasPermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { conditionLabel, itemStatusLabel, loanStatusLabel } from "@/backend/inventory-input";
import { organizationTimeZone } from "@/backend/time-format";

export type ItemRow = {
  id: string; code: string; name: string; quantity: number; availableQuantity: number;
  status: string; statusLabel: string; condition: string; conditionLabel: string;
  location: string; notes: string;
};
export type LoanRow = {
  id: string; itemId: string; itemName: string; borrowerId: string; borrowerName: string;
  programId: string; programName: string; quantity: number; purpose: string;
  borrowedOn: string; expectedReturnOn: string; returnedOn: string;
  borrowedLabel: string; expectedLabel: string;
  status: string; statusLabel: string; overdue: boolean; mine: boolean;
};
export type Option = { id: string; name: string };

const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const format = (value: string | null) => value ? dateLabel.format(new Date(`${value}T00:00:00`)) : "-";
const isoToday = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: organizationTimeZone }).format(new Date());

const openLoanStatuses = ["waiting_approval", "approved", "borrowed", "condition_check"];

const loadInventoryRows = unstable_cache(async () => {
  const [{ data: items, error }, { data: loans }, { data: profiles }, { data: programs }] = await Promise.all([
    supabaseAdmin.from("inventory_items").select("id,code,name,quantity,available_quantity,status,condition,location,notes").order("code").limit(500),
    supabaseAdmin.from("inventory_transactions").select("id,item_id,borrower_id,program_id,quantity,purpose,borrowed_on,expected_return_on,returned_on,status").order("created_at", { ascending: false }).limit(500),
    supabaseAdmin.from("profiles").select("id,full_name,member_status").order("full_name").limit(500),
    supabaseAdmin.from("programs").select("id,name").order("name").limit(300),
  ]);
  if (error) throw new Error(`Gagal memuat inventaris: ${error.message}`);

  const itemNameById = new Map((items || []).map(item => [item.id, item.name]));
  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
  const programNameById = new Map((programs || []).map(program => [program.id, program.name]));
  const today = isoToday();

  return {
    items: (items || []).map(item => ({
      id: item.id, code: item.code, name: item.name,
      quantity: item.quantity, availableQuantity: item.available_quantity,
      status: item.status, statusLabel: itemStatusLabel(item.status),
      condition: item.condition, conditionLabel: conditionLabel(item.condition),
      location: item.location || "", notes: item.notes || "",
    })),
    loans: (loans || []).map(loan => ({
      id: loan.id, itemId: loan.item_id, itemName: itemNameById.get(loan.item_id) || "Barang terhapus",
      borrowerId: loan.borrower_id, borrowerName: nameById.get(loan.borrower_id) || "Tanpa nama",
      programId: loan.program_id || "", programName: loan.program_id ? programNameById.get(loan.program_id) || "Program terhapus" : "Organisasi",
      quantity: loan.quantity, purpose: loan.purpose,
      borrowedOn: loan.borrowed_on, expectedReturnOn: loan.expected_return_on, returnedOn: loan.returned_on || "",
      borrowedLabel: format(loan.borrowed_on), expectedLabel: format(loan.expected_return_on),
      status: loan.status, statusLabel: loanStatusLabel(loan.status),
      overdue: !loan.returned_on && loan.expected_return_on < today && openLoanStatuses.includes(loan.status),
      mine: false,
    })),
    members: (profiles || []).filter(profile => profile.member_status === "active").map(profile => ({ id: profile.id, name: profile.full_name })),
    programs: (programs || []).map(program => ({ id: program.id, name: program.name })),
  };
}, ["inventory"], { revalidate: 30, tags: ["inventory", "members", "programs"] });

export async function loadInventory() {
  const [userId, canManage] = await Promise.all([currentUserId(), hasPermission("inventory.manage")]);
  const data = await loadInventoryRows();
  // Kebijakan RLS inventory_transactions hanya membuka transaksi milik sendiri
  // bagi yang tidak memegang inventory.manage; aturan itu ditiru di sini.
  const loans = data.loans
    .map(loan => ({ ...loan, mine: loan.borrowerId === userId }))
    .filter(loan => canManage || loan.borrowerId === userId);

  return {
    ...data,
    loans,
    currentUserId: userId,
    scopeLabel: canManage ? "Seluruh peminjaman" : "Peminjaman milikmu",
    totalItems: data.items.reduce((total, item) => total + item.quantity, 0),
    borrowedCount: loans.filter(loan => loan.status === "borrowed").length,
    overdueCount: loans.filter(loan => loan.overdue).length,
    waitingCount: loans.filter(loan => loan.status === "waiting_approval").length,
  };
}
