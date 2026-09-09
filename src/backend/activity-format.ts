const entityLabels: Record<string, string> = {
  account: "Akun",
  period: "Periode",
  member: "Anggota",
  division: "Divisi",
  management: "Kepengurusan",
  program: "Program",
  task: "Tugas",
  attendance: "Kehadiran",
  event: "Kegiatan",
  document: "Dokumen",
  inventory: "Inventaris",
  settings: "Pengaturan",
};

export const entityTypeLabel = (value: string) => entityLabels[value] || value;

// Beberapa aksi lama menyimpan nilai enum mentah di ujung kalimat, misalnya
// "Mencatat kehadiran: present". Enum diterjemahkan agar log terbaca manusia
// tanpa perlu mengubah baris yang sudah tersimpan.
const enumLabels: Record<string, string> = {
  present: "Hadir",
  late: "Terlambat",
  partial: "Hadir sebagian",
  excused: "Izin",
  absent: "Alpa",
  planning: "Perencanaan",
  ongoing: "Berjalan",
  evaluation: "Evaluasi",
  completed: "Selesai",
  cancelled: "Batal",
  todo: "Belum mulai",
  in_progress: "Dikerjakan",
  review: "Review",
  done: "Selesai",
};

export function humanizeAction(action: string) {
  return action.replace(/(:\s*|menjadi\s+)([a-z_]+)$/i, (whole, prefix: string, value: string) => {
    const label = enumLabels[value.toLowerCase()];
    return label ? `${prefix}${label}` : whole;
  });
}
