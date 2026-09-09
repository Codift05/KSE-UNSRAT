export const memberStatuses = ["active", "inactive", "transferred", "alumni"] as const;
export type MemberStatus = (typeof memberStatuses)[number];

export function memberName(value: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 100) throw new Error("Nama harus 2–100 karakter");
  return name;
}

export function memberYear(value: string, label: string): number | null {
  const year = value.trim();
  if (!year) return null;
  if (!/^\d{4}$/.test(year)) throw new Error(`${label} harus berupa 4 digit tahun`);
  const parsed = Number(year);
  if (parsed < 1990 || parsed > 2100) throw new Error(`${label} harus antara 1990 dan 2100`);
  return parsed;
}

export function memberStatusValue(value: string): MemberStatus {
  const status = value.trim();
  if (!(memberStatuses as readonly string[]).includes(status)) throw new Error("Status anggota tidak dikenali");
  return status as MemberStatus;
}

export function optionalText(value: string, max = 120) {
  const text = value.trim();
  if (text.length > max) throw new Error(`Isian melebihi ${max} karakter`);
  return text || null;
}
