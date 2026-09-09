export function divisionName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 60) throw new Error("Nama divisi harus 3–60 karakter");
  return name;
}
