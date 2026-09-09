import "server-only";

// Satu tempat yang menentukan apakah integrasi Google Drive sudah siap dipakai.
// Selama belum, antarmuka harus mengatakannya apa adanya, bukan menampilkan
// status "tersambung" yang tidak benar.
const requiredKeys = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GOOGLE_DRIVE_ROOT_FOLDER_ID"] as const;

export type DriveConfig = { configured: boolean; missing: string[] };

export function driveConfig(): DriveConfig {
  const missing = requiredKeys.filter(key => !process.env[key]);
  return { configured: missing.length === 0, missing: [...missing] };
}
