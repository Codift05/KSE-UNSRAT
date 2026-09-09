import "server-only";
import { driveConfig } from "@/backend/drive-config";

type CachedToken = { value: string; expiresAt: number };
let cached: CachedToken | null = null;

function requireConfig() {
  const { configured, missing } = driveConfig();
  if (!configured) throw new Error(`Google Drive belum dikonfigurasi. Variabel yang kurang: ${missing.join(", ")}`);
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!,
  };
}

// Access token berlaku satu jam. Disimpan di memori proses dan diperbarui
// enam puluh detik sebelum kedaluwarsa agar permintaan tidak jatuh tepat di
// batas masa berlaku.
async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;
  const { clientId, clientSecret, refreshToken } = requireConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const token = await response.json();
  if (!response.ok || !token.access_token) {
    // invalid_grant berarti refresh token dicabut atau kedaluwarsa. Selama
    // aplikasi berstatus Testing di Google, umurnya hanya tujuh hari.
    const reason = token.error === "invalid_grant"
      ? "Refresh token Google tidak berlaku lagi. Jalankan `node scripts/google-drive-token.mjs` untuk menyambung ulang."
      : `Gagal memperbarui akses Google Drive: ${token.error_description || token.error || response.status}`;
    throw new Error(reason);
  }
  cached = { value: token.access_token, expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000 };
  return cached.value;
}

async function driveFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${await accessToken()}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Google Drive menolak permintaan: ${body?.error?.message || response.status}`);
  return body;
}

const escapeQuery = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export function driveRootFolderId() {
  return requireConfig().rootFolderId;
}

// Scope drive.file hanya memberi akses pada berkas yang dibuat aplikasi ini,
// jadi pencarian selalu dibatasi pada induk yang juga dibuat aplikasi ini.
export async function ensureFolder(name: string, parentId: string) {
  const query = `name = '${escapeQuery(name)}' and '${escapeQuery(parentId)}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const found = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`);
  if (found.files?.length) return String(found.files[0].id);

  const created = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  return String(created.id);
}

export async function uploadFile(file: File, parentId: string) {
  const metadata = { name: file.name, parents: [parentId] };
  const body = new FormData();
  body.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  body.append("file", file);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}` },
    body,
  });
  const uploaded = await response.json().catch(() => ({}));
  if (!response.ok || !uploaded.id) throw new Error(`Unggahan ke Google Drive gagal: ${uploaded?.error?.message || response.status}`);
  return { id: String(uploaded.id), name: String(uploaded.name), mimeType: String(uploaded.mimeType || file.type), link: String(uploaded.webViewLink || "") };
}

export async function deleteDriveFile(fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  // 404 berarti berkas sudah tidak ada; itu hasil akhir yang sama dan bukan galat.
  if (!response.ok && response.status !== 404) throw new Error(`Berkas gagal dihapus dari Google Drive: ${response.status}`);
}
