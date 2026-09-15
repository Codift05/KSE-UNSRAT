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

/** Username dipakai untuk masuk, jadi bentuknya dijaga ketat: huruf kecil,
 *  angka, dan titik saja. Spasi maupun huruf besar membuat orang salah ketik
 *  berulang kali tanpa tahu sebabnya. */
export function usernameValue(value: string) {
  const username = value.trim().toLowerCase();
  if (!username) throw new Error("Username wajib diisi");
  if (username.length < 3 || username.length > 20) throw new Error("Username harus 3–20 karakter");
  if (!/^[a-z][a-z0-9.]*$/.test(username)) throw new Error("Username diawali huruf dan hanya boleh berisi huruf kecil, angka, dan titik");
  return username;
}

/** Dibentuk dari nama depan. Dipakai saat pengurus membuat akun agar tidak
 *  perlu mengarang username sendiri. */
export function suggestUsername(fullName: string) {
  const dasar = (fullName || "").trim().toLowerCase().split(/\s+/)[0]?.replace(/[^a-z0-9]/g, "") || "";
  return dasar.length >= 3 ? dasar.slice(0, 20) : "";
}
