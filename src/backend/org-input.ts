function trimmedName(value: string, label: string, min: number, max: number) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < min || name.length > max) throw new Error(`${label} harus ${min}–${max} karakter`);
  return name;
}

export const divisionName = (value: string) => trimmedName(value, "Nama divisi", 3, 60);
export const positionName = (value: string) => trimmedName(value, "Nama jabatan", 3, 60);

export function sortOrder(value: string) {
  const order = value.trim();
  if (!order) return 0;
  if (!/^\d{1,3}$/.test(order)) throw new Error("Urutan harus angka 0–999");
  return Number(order);
}
