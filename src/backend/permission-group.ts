const groupLabels: Record<string, string> = {
  system: "Sistem",
  member: "Anggota",
  program: "Program",
  task: "Tugas",
  inventory: "Inventaris",
  document: "Dokumen",
  attendance: "Kehadiran",
};

export function permissionGroup(key: string) {
  const prefix = key.split(".")[0];
  return { prefix, label: groupLabels[prefix] || prefix };
}

// Izin yang membuat seseorang dapat mengelola sistem. Dipakai sebagai penjaga
// agar perubahan role tidak pernah menyisakan organisasi tanpa pengelola.
export const rootPermission = "system.manage";
