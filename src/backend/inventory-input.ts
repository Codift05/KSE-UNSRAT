export const itemStatuses = ["available", "borrowed", "under_repair", "damaged", "lost"] as const;
export const itemConditions = ["good", "minor_damage", "damaged"] as const;
export const loanStatuses = ["waiting_approval", "approved", "borrowed", "returned", "condition_check", "completed", "rejected"] as const;

export const itemStatusLabel = (value: string) => ({ available: "Tersedia", borrowed: "Dipinjam", under_repair: "Perbaikan", damaged: "Rusak", lost: "Hilang" })[value] || value;
export const conditionLabel = (value: string) => ({ good: "Baik", minor_damage: "Rusak ringan", damaged: "Rusak" })[value] || value;
export const loanStatusLabel = (value: string) => ({ waiting_approval: "Menunggu persetujuan", approved: "Disetujui", borrowed: "Dipinjam", returned: "Dikembalikan", condition_check: "Cek kondisi", completed: "Selesai", rejected: "Ditolak" })[value] || value;

function oneOf(allowed: readonly string[], value: string, label: string) {
  const picked = value.trim();
  if (!allowed.includes(picked)) throw new Error(`${label} tidak dikenali`);
  return picked;
}

export const itemStatusValue = (value: string) => oneOf(itemStatuses, value, "Status barang");
export const conditionValue = (value: string) => oneOf(itemConditions, value, "Kondisi barang");

export function itemCode(value: string) {
  const code = value.trim().toUpperCase().replace(/\s+/g, "-");
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) throw new Error("Kode barang hanya boleh huruf, angka, dan tanda hubung (3–32 karakter)");
  return code;
}

export function itemName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 100) throw new Error("Nama barang harus 3–100 karakter");
  return name;
}

export function quantityValue(value: string, label: string) {
  const quantity = value.trim();
  if (!/^\d{1,5}$/.test(quantity)) throw new Error(`${label} harus angka bulat`);
  return Number(quantity);
}

// available_quantity <= quantity dijaga constraint database; diperiksa lebih dulu
// agar pengurus melihat pesan yang jelas, bukan galat Postgres.
export function requireStockWithinTotal(available: number, total: number) {
  if (available > total) throw new Error("Jumlah tersedia tidak boleh melebihi jumlah total");
  return { available, total };
}

export function requireLoanDates(borrowedOn: string, expectedReturnOn: string) {
  if (!borrowedOn || !expectedReturnOn) throw new Error("Tanggal pinjam dan rencana kembali wajib diisi");
  if (borrowedOn > expectedReturnOn) throw new Error("Rencana kembali tidak boleh sebelum tanggal pinjam");
  return { borrowedOn, expectedReturnOn };
}
