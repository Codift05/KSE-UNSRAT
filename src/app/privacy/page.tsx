import Link from "next/link";

export const metadata = {
  title: "Kebijakan privasi",
  description: "Data yang dikumpulkan KSE Management System dan cara penggunaannya.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1>Kebijakan privasi</h1>
      <p>Berlaku sejak 9 September 2026 · Paguyuban KSE Unsrat</p>

      <p>KSE Management System adalah sistem internal Paguyuban KSE Unsrat. Halaman ini menjelaskan data apa yang disimpan, siapa yang dapat melihatnya, dan berapa lama disimpan.</p>

      <h2>Data yang dikumpulkan</h2>
      <ul>
        <li><strong>Identitas anggota</strong> — nama, email, nomor telepon, fakultas, program studi, angkatan, dan tahun masuk KSE.</li>
        <li><strong>Kehadiran dan poin</strong> — status kehadiran pada setiap kegiatan beserta poin yang diperoleh.</li>
        <li><strong>Lokasi</strong> — pada absensi mandiri kegiatan luring, koordinat diambil <em>hanya</em> saat kamu menekan check-in atau check-out. Tidak ada pelacakan latar belakang, dan lokasi tidak direkam di luar dua momen itu.</li>
        <li><strong>Aktivitas sistem</strong> — catatan perubahan penting beserta pelaku dan waktunya.</li>
        <li><strong>Dokumen</strong> — berkas yang kamu unggah beserta judul, kategori, dan program terkait.</li>
      </ul>

      <h2>Tempat penyimpanan</h2>
      <p>Data dan metadata disimpan di Supabase. Berkas dokumen disimpan di Google Drive milik organisasi; sistem hanya memiliki akses pada berkas yang dibuatnya sendiri, bukan pada isi Drive lainnya.</p>

      <h2>Siapa yang dapat melihat</h2>
      <p>Akses ditentukan oleh peran kepengurusan. Anggota melihat datanya sendiri dan informasi yang memang bersifat umum bagi anggota. Pengurus melihat data sesuai izin yang diberikan Super Admin. Dokumen bertanda <em>Pribadi</em> hanya terlihat oleh pengunggahnya.</p>

      <h2>Penyimpanan dan penghapusan</h2>
      <p>Data kepengurusan dan kehadiran disimpan lintas periode karena menjadi histori organisasi. Kamu dapat meminta koreksi data pribadimu kepada pengurus kapan saja. Penghapusan akun menghapus profil beserta datanya secara permanen.</p>

      <h2>Yang tidak kami lakukan</h2>
      <p>Data tidak dijual, tidak dibagikan ke pihak ketiga di luar layanan penyimpanan yang disebut di atas, dan tidak dipakai untuk iklan.</p>

      <h2>Kontak</h2>
      <p>Pertanyaan mengenai data pribadi dapat disampaikan kepada pengurus Paguyuban KSE Unsrat melalui Super Admin sistem.</p>

      <p><Link href="/">Kembali ke dashboard</Link> · <Link href="/terms">Ketentuan penggunaan</Link></p>
    </main>
  );
}
