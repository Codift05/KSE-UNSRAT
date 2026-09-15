export const directions = ["in", "out"] as const;
export type Direction = (typeof directions)[number];

export const directionLabel = (value: string) => ({ in: "Masuk", out: "Keluar" })[value] || value;

// Batas atas sengaja longgar tetapi tetap ada, supaya salah ketik nol berlebih
// tertangkap sebelum masuk ke laporan.
export const maxAmount = 999_999_999;

/** Menerima "Rp1.500.000", "1,500,000", "1500000", dan "Rp 1 500 000".
 *  Pemisah ribuan berbeda-beda kebiasaan, jadi seluruhnya dibuang; yang ditolak
 *  hanyalah nilai yang benar-benar bukan angka. */
export function rupiah(value: string, label = "Nominal") {
  const raw = (value || "").trim();
  if (!raw) throw new Error(`${label} wajib diisi`);
  if (/[a-zA-Z]/.test(raw.replace(/^rp\.?\s*/i, ""))) throw new Error(`${label} hanya boleh berisi angka`);
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) throw new Error(`${label} hanya boleh berisi angka`);
  const amount = Number(digits);
  if (amount <= 0) throw new Error(`${label} harus lebih dari nol`);
  if (amount > maxAmount) throw new Error(`${label} melebihi batas wajar. Periksa kembali jumlah nolnya.`);
  return amount;
}

export function directionValue(value: string) {
  const picked = (value || "").trim();
  if (!(directions as readonly string[]).includes(picked)) throw new Error("Arah transaksi tidak dikenali");
  return picked as Direction;
}

// Tanggal wajib. Pada catatan lama sepertiga baris mengosongkannya dan mewarisi
// tanggal baris di atasnya, sehingga urutannya rusak begitu data diurutkan.
export function financeDate(value: string, label = "Tanggal") {
  const date = (value || "").trim();
  if (!date) throw new Error(`${label} wajib diisi`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`${label} bukan tanggal yang valid`);
  return date;
}

export function financeDescription(value: string) {
  const text = (value || "").trim().replace(/\s+/g, " ");
  if (text.length < 3 || text.length > 140) throw new Error("Uraian harus 3–140 karakter");
  return text;
}

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

/** Saldo tidak pernah disimpan, selalu dihitung ulang dari transaksi. Inilah
 *  yang membuat kesalahan seperti selisih Rp410.000 pada catatan lama tidak
 *  mungkin terjadi lagi: tidak ada angka saldo yang bisa salah ketik. */
export function runningBalance(entries: { direction: string; amount: number }[]) {
  return entries.reduce((saldo, entry) => saldo + (entry.direction === "in" ? entry.amount : -entry.amount), 0);
}

export function duesStatus(paid: number, target: number) {
  if (target <= 0) return { label: "Belum ada target", outstanding: 0, settled: false };
  const outstanding = Math.max(0, target - paid);
  if (outstanding === 0) return { label: "Lunas", outstanding: 0, settled: true };
  if (paid === 0) return { label: "Belum bayar", outstanding, settled: false };
  return { label: "Kurang", outstanding, settled: false };
}
