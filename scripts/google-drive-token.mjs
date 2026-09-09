// Mengambil refresh token Google Drive sekali jalan.
//
// Dijalankan manual oleh pengurus, bukan bagian dari aplikasi:
//   node scripts/google-drive-token.mjs
//
// Membaca GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET dari .env.local, membuka
// halaman izin Google, lalu menukar kode yang diterima menjadi refresh token.
// Redirect memakai loopback localhost karena tipe klien Desktop app
// mengizinkannya tanpa perlu mendaftarkan URL apa pun.

import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;

function readEnvLocal() {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter(line => line.trim() && !line.trim().startsWith("#") && line.includes("="))
        .map(line => {
          const at = line.indexOf("=");
          return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^['"]|['"]$/g, "")];
        })
    );
  } catch {
    return {};
  }
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

function waitForCode() {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, REDIRECT);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(`<meta charset="utf-8"><body style="font-family:system-ui;padding:40px">
        <h2>${code ? "Berhasil." : "Gagal."}</h2>
        <p>${code ? "Kembali ke terminal, refresh token sedang diambil." : `Google menolak permintaan: ${error}`}</p>
      </body>`);
      server.close();
      code ? resolve(code) : reject(new Error(error || "Kode otorisasi tidak diterima"));
    });
    server.on("error", reject);
    server.listen(PORT);
  });
}

const env = readEnvLocal();
const clientId = env.GOOGLE_CLIENT_ID || await ask("GOOGLE_CLIENT_ID: ");
const clientSecret = env.GOOGLE_CLIENT_SECRET || await ask("GOOGLE_CLIENT_SECRET: ");
if (!clientId || !clientSecret) {
  console.error("Client ID dan Client Secret wajib diisi. Isi dulu di .env.local atau ketik saat diminta.");
  process.exit(1);
}

const consentUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
consentUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  // access_type=offline dan prompt=consent wajib, tanpa keduanya Google tidak
  // pernah mengirimkan refresh token pada persetujuan berikutnya.
  access_type: "offline",
  prompt: "consent",
}).toString();

console.log("\nBuka tautan ini di browser, lalu setujui akses:\n");
console.log(consentUrl.toString());
console.log(`\nMenunggu balasan di ${REDIRECT} ...`);

const code = await waitForCode();

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
});
const token = await response.json();

if (!response.ok || !token.refresh_token) {
  console.error("\nGagal menukar kode menjadi token:", JSON.stringify(token, null, 2));
  console.error("\nBila refresh_token kosong padahal kode diterima, cabut akses aplikasi di");
  console.error("https://myaccount.google.com/permissions lalu jalankan ulang skrip ini.");
  process.exit(1);
}

// Ditulis langsung ke .env.local, bukan dicetak untuk disalin manual: token
// ini panjang dan penuh karakter yang mudah tertukar saat dibaca mata (I dan l,
// O dan 0), dan satu karakter salah menghasilkan invalid_grant yang membingungkan.
const envPath = ".env.local";
let envFile = "";
try {
  envFile = readFileSync(envPath, "utf8");
} catch {
  envFile = "";
}
const line = `GOOGLE_REFRESH_TOKEN=${token.refresh_token}`;
envFile = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(envFile)
  ? envFile.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line)
  : `${envFile.replace(/\s*$/, "")}\n${line}\n`;
writeFileSync(envPath, envFile);

console.log(`\nRefresh token tersimpan ke ${envPath} (${token.refresh_token.length} karakter).`);
console.log("Scope yang diberikan:", token.scope);

// Diuji langsung supaya kegagalan ketahuan sekarang, bukan saat dipakai nanti.
const check = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: token.refresh_token, grant_type: "refresh_token" }),
});
const verified = await check.json();
console.log(check.ok && verified.access_token ? "\nTerverifikasi: token dapat menukar access token." : `\nPeringatan: verifikasi gagal - ${JSON.stringify(verified)}`);
