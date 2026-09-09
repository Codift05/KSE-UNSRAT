import { removeTestAccount } from "./account.ts";

// Dijalankan sekali setelah seluruh test, berhasil maupun gagal, agar akun uji
// tidak pernah tertinggal di database sungguhan.
export default async function globalTeardown() {
  await removeTestAccount();
}
