import Link from "next/link";

export const metadata = {
  title: "Ketentuan penggunaan",
  description: "Aturan penggunaan KSE Management System bagi anggota dan pengurus.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <h1>Ketentuan penggunaan</h1>
      <p>Berlaku sejak 9 September 2026 · Paguyuban KSE Unsrat</p>

      <p>Sistem ini disediakan untuk keperluan internal Paguyuban KSE Unsrat. Dengan masuk ke sistem, kamu menyetujui ketentuan berikut.</p>

      <h2>Akun</h2>
      <p>Akun dibuat oleh pengurus, bukan melalui pendaftaran mandiri. Satu akun mewakili satu orang. Jaga kerahasiaan kata sandimu dan segera laporkan bila kamu menduga akunmu dipakai orang lain.</p>

      <h2>Kehadiran dan poin</h2>
      <p>Absensi mandiri memerlukan lokasi dan kode kegiatan, dan selalu berstatus menunggu verifikasi sampai disetujui pengurus. Mencatatkan kehadiran untuk orang lain, memalsukan lokasi, atau membagikan kode kegiatan kepada yang tidak hadir merupakan pelanggaran dan dapat berakibat pembatalan poin.</p>

      <h2>Dokumen dan inventaris</h2>
      <p>Unggah hanya berkas yang berkaitan dengan kegiatan organisasi. Barang yang dipinjam adalah tanggung jawab peminjam sampai dikembalikan dan diperiksa kondisinya.</p>

      <h2>Data organisasi</h2>
      <p>Isi sistem ini adalah milik organisasi, bukan milik pribadi pengurus yang sedang menjabat. Data tetap berada di sistem ketika kepengurusan berganti.</p>

      <h2>Perubahan</h2>
      <p>Ketentuan ini dapat diperbarui seiring berkembangnya sistem. Perubahan penting akan disampaikan kepada pengurus.</p>

      <p><Link href="/">Kembali ke dashboard</Link> · <Link href="/privacy">Kebijakan privasi</Link></p>
    </main>
  );
}
