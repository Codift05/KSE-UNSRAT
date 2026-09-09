export const documentVisibilities = ["members", "management", "private"] as const;

export const visibilityLabel = (value: string) => ({ members: "Semua anggota", management: "Pengurus", private: "Pribadi" })[value] || value;

export function documentTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 140) throw new Error("Judul dokumen harus 3–140 karakter");
  return title;
}

export function visibilityValue(value: string) {
  const picked = value.trim() || "members";
  if (!(documentVisibilities as readonly string[]).includes(picked)) throw new Error("Visibilitas dokumen tidak dikenali");
  return picked;
}

// Berkas besar tidak lewat server action melainkan ditautkan sebagai folder
// Drive, sesuai PRD 8.18. Batasnya sengaja sama dengan bodySizeLimit pada
// next.config agar penolakan terjadi dengan pesan yang jelas, bukan galat
// jaringan yang tidak menjelaskan apa-apa.
export const maxUploadBytes = 10 * 1024 * 1024;

export function requireUploadableFile(size: number, name: string) {
  if (!size) throw new Error("Pilih berkas yang akan diunggah");
  if (size > maxUploadBytes) throw new Error(`${name} berukuran lebih dari 10 MB. Untuk dokumentasi besar, tautkan folder Drive.`);
  return size;
}
