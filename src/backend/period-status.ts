export type PeriodStatus = "Aktif" | "Diarsipkan" | "Draft";

export function periodStatus(isActive: boolean, archivedAt: string | null): PeriodStatus {
  return isActive ? "Aktif" : archivedAt ? "Diarsipkan" : "Draft";
}

export function validatePeriodRange(name: string, startsOn: string, endsOn: string) {
  if (name.length < 4 || name.length > 40) throw new Error("Nama periode harus 4–40 karakter");
  if (!startsOn || !endsOn) throw new Error("Tanggal mulai dan selesai wajib diisi");
  if (Number.isNaN(Date.parse(startsOn)) || Number.isNaN(Date.parse(endsOn))) throw new Error("Format tanggal tidak valid");
  if (Date.parse(startsOn) >= Date.parse(endsOn)) throw new Error("Tanggal mulai harus lebih awal dari tanggal selesai");
  return { name, startsOn, endsOn };
}
