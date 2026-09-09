export type AttendanceStanding = {
  activity: "Sangat aktif" | "Aktif" | "Kurang aktif" | "Belum ada catatan";
  warning: "Aman" | "SP1" | "SP2" | "SP3";
};

export function attendanceStanding(present: number, late: number, partial: number, absent: number): AttendanceStanding {
  const participation = present + late + partial;
  const counted = participation + absent;
  const activity = counted === 0 ? "Belum ada catatan" : participation / counted >= .8 ? "Sangat aktif" : participation / counted >= .6 ? "Aktif" : "Kurang aktif";
  const warning = absent >= 8 ? "SP3" : absent >= 6 ? "SP2" : absent >= 3 ? "SP1" : "Aman";
  return { activity, warning };
}

export const memberStatusLabel = (status: string) => ({ active: "Aktif", inactive: "Nonaktif", alumni: "Alumni", transferred: "Pindah" })[status] || status;
