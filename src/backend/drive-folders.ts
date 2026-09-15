import "server-only";
import { driveRootFolderId, ensureFolder } from "@/backend/drive-client";

// Struktur folder mengikuti PRD 8.17:
//   KSE UNSRAT / <periode> / Programs / <program> / <kategori>
//   KSE UNSRAT / <periode> / Administration / <kategori>
// Dokumen tanpa program dianggap milik organisasi dan masuk ke Administration.
export const administrationFolder = "Administration";
export const programsFolder = "Programs";

export type DocumentFolderTarget = { periodName: string; programName?: string; categoryName?: string };

export async function ensureDocumentFolder({ periodName, programName, categoryName }: DocumentFolderTarget) {
  const period = await ensureFolder(periodName, driveRootFolderId());
  const branch = programName
    ? await ensureFolder(programName, await ensureFolder(programsFolder, period))
    : await ensureFolder(administrationFolder, period);
  return categoryName ? ensureFolder(categoryName, branch) : branch;
}

// Bukti pembayaran keuangan diarsipkan terpisah dari dokumen program, mengikuti
// cabang Finance pada PRD 8.17.
export const financeFolder = "Finance";
export const financeProofFolder = "Transactions";

export async function ensureFinanceFolder(periodName: string) {
  const period = await ensureFolder(periodName, driveRootFolderId());
  return ensureFolder(financeProofFolder, await ensureFolder(financeFolder, period));
}
