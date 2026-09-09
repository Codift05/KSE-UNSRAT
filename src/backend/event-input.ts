// Kegiatan bertipe "attendance" dimiliki modul Kehadiran: barisnya membawa
// konfigurasi poin, token, dan radius. Kalender menampilkannya tetapi tidak
// boleh mengubahnya, karena menghapus event akan menghapus attendance_records
// beserta poinnya lewat on delete cascade.
export const attendanceEventType = "attendance";

export const agendaTypes = ["meeting", "program", "deadline", "activity"] as const;

const labels: Record<string, string> = {
  meeting: "Rapat",
  program: "Program",
  deadline: "Tenggat",
  activity: "Kegiatan",
  attendance: "Kehadiran",
};

export const eventTypeLabel = (value: string) => labels[value] || value;

export function agendaTypeValue(value: string) {
  const picked = value.trim();
  if (!(agendaTypes as readonly string[]).includes(picked)) throw new Error("Jenis agenda tidak dikenali");
  return picked;
}

export function eventTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 120) throw new Error("Judul agenda harus 3–120 karakter");
  return title;
}

export function requireOrderedMoments(startsAt: string, endsAt: string | null) {
  if (endsAt && endsAt <= startsAt) throw new Error("Waktu selesai harus setelah waktu mulai");
  return { startsAt, endsAt };
}
