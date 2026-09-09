// Manado berada di WITA (UTC+8) sedangkan server berjalan di UTC, jadi jam
// sapaan dan batas tanggal harus dihitung dari zona waktu organisasi.
export const organizationTimeZone = "Asia/Makassar";

export function greetingForHour(hour: number) {
  if (hour < 4 || hour >= 19) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  return "Selamat sore";
}

export function relativeTimeLabel(fromIso: string, now: Date) {
  const seconds = Math.floor((now.getTime() - new Date(fromIso).getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone }).format(new Date(fromIso));
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}
