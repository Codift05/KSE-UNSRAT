export const programStatuses = ["planning", "ongoing", "evaluation", "completed", "cancelled"] as const;
export const taskStatuses = ["todo", "in_progress", "review", "done"] as const;
export const priorities = ["low", "medium", "high", "urgent"] as const;

export const programStatusLabel = (value: string) => ({ planning: "Perencanaan", ongoing: "Berjalan", evaluation: "Evaluasi", completed: "Selesai", cancelled: "Batal" })[value] || value;
export const taskStatusLabel = (value: string) => ({ todo: "Belum mulai", in_progress: "Dikerjakan", review: "Review", done: "Selesai" })[value] || value;
export const priorityLabel = (value: string) => ({ low: "Rendah", medium: "Sedang", high: "Tinggi", urgent: "Mendesak" })[value] || value;

function oneOf(allowed: readonly string[], value: string, label: string) {
  const picked = value.trim();
  if (!allowed.includes(picked)) throw new Error(`${label} tidak dikenali`);
  return picked;
}

export const programStatusValue = (value: string) => oneOf(programStatuses, value, "Status program");
export const taskStatusValue = (value: string) => oneOf(taskStatuses, value, "Status tugas");
export const priorityValue = (value: string) => oneOf(priorities, value, "Prioritas");

export function programName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 100) throw new Error("Nama program harus 3–100 karakter");
  return name;
}

export function taskTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 140) throw new Error("Judul tugas harus 3–140 karakter");
  return title;
}

export function optionalDate(value: string, label: string) {
  const date = value.trim();
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`${label} bukan tanggal yang valid`);
  return date;
}

// Skema menolak rentang terbalik lewat constraint, tetapi memeriksanya lebih
// dulu memberi pesan yang bisa dibaca pengurus alih-alih galat Postgres.
export function requireOrderedDates(startsOn: string | null, endsOn: string | null, label: string) {
  if (startsOn && endsOn && startsOn > endsOn) throw new Error(`Tanggal mulai harus lebih awal dari ${label}`);
  return { startsOn, endsOn };
}

export function budgetValue(value: string) {
  const budget = value.trim().replace(/[.\s]/g, "");
  if (!budget) return 0;
  if (!/^\d{1,12}$/.test(budget)) throw new Error("Anggaran harus angka bulat tanpa tanda minus");
  return Number(budget);
}
