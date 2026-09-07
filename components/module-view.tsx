"use client";

import { CalendarBlank, CheckCircle, Clock, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type Module = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  stats: [string, string, string][];
  columns: string[];
  rows: string[][];
};

const modules: Record<string, Module> = {
  "/members": { eyebrow: "ORGANISASI", title: "Anggota", description: "Kelola data dan status seluruh anggota KSE Unsrat.", action: "Tambah anggota", stats: [["Anggota aktif", "48", "Periode 2026-2027"], ["Alumni", "73", "Semua periode"], ["Divisi aktif", "4", "Struktur saat ini"]], columns: ["Nama", "Program studi", "Angkatan", "Divisi", "Status"], rows: [["Fitra Maulana", "Teknik Informatika", "2022", "Internal Development", "Aktif"], ["Vinny Moningka", "Akuntansi", "2021", "Sekretariat", "Aktif"], ["Ezra Mandagi", "Ilmu Komunikasi", "2022", "Public Relation", "Aktif"], ["Miftah Samola", "Pendidikan", "2023", "Education", "Aktif"]] },
  "/management": { eyebrow: "ORGANISASI", title: "Kepengurusan", description: "Struktur pengurus pada periode yang sedang aktif.", action: "Atur pengurus", stats: [["Pengurus", "18", "Periode aktif"], ["Posisi", "9", "Dapat dikonfigurasi"], ["Belum terisi", "1", "Posisi kosong"]], columns: ["Nama", "Jabatan", "Divisi", "Periode", "Status"], rows: [["Fitra Maulana", "Ketua", "Inti", "2026-2027", "Aktif"], ["Ezra Mandagi", "Wakil Ketua", "Inti", "2026-2027", "Aktif"], ["Vinny Moningka", "Sekretaris", "Inti", "2026-2027", "Aktif"]] },
  "/divisions": { eyebrow: "ORGANISASI", title: "Divisi", description: "Pantau koordinator, anggota, dan program setiap divisi.", action: "Tambah divisi", stats: [["Divisi aktif", "4", "Periode 2026-2027"], ["Anggota terbagi", "42", "87,5% anggota"], ["Program aktif", "6", "Lintas divisi"]], columns: ["Nama divisi", "Koordinator", "Anggota", "Program", "Status"], rows: [["Community Development", "Miftah Samola", "12 anggota", "2 program", "Aktif"], ["Education", "Maria Runtuwene", "10 anggota", "2 program", "Aktif"], ["Internal Development", "Kevin Sondakh", "11 anggota", "1 program", "Aktif"], ["Public Relation", "Ezra Mandagi", "9 anggota", "1 program", "Aktif"]] },
  "/periods": { eyebrow: "KONFIGURASI ORGANISASI", title: "Periode", description: "Kelola masa kepengurusan dan histori organisasi.", action: "Buat periode", stats: [["Periode aktif", "2026-2027", "Berjalan"], ["Periode arsip", "2", "Data tersimpan"], ["Total periode", "3", "Sejak 2024"]], columns: ["Periode", "Tanggal mulai", "Tanggal selesai", "Pengurus", "Status"], rows: [["2026-2027", "1 Sep 2026", "31 Agu 2027", "18 pengurus", "Aktif"], ["2025-2026", "1 Sep 2025", "31 Agu 2026", "17 pengurus", "Diarsipkan"], ["2024-2025", "1 Sep 2024", "31 Agu 2025", "16 pengurus", "Diarsipkan"]] },
  "/programs": { eyebrow: "PROGRAM KERJA", title: "Semua program", description: "Monitor progres, penanggung jawab, dan tenggat program.", action: "Program baru", stats: [["Program aktif", "6", "Periode ini"], ["Selesai", "3", "Periode ini"], ["Mendekati tenggat", "2", "Perlu perhatian"]], columns: ["Program", "Divisi", "PIC", "Tenggat", "Status"], rows: [["KSE Mengajar", "Community Development", "Miftah Samola", "18 Sep 2026", "Berjalan"], ["Sharing Session", "Education", "Maria Runtuwene", "24 Sep 2026", "Berjalan"], ["Welcoming Scholars", "Internal Development", "Kevin Sondakh", "2 Okt 2026", "Perencanaan"]] },
  "/tasks": { eyebrow: "OPERASI PROGRAM", title: "Tugas saya", description: "Tugas aktif dari seluruh program yang kamu ikuti.", action: "Tambah tugas", stats: [["Belum selesai", "12", "Semua program"], ["Terlambat", "3", "Perlu tindakan"], ["Selesai minggu ini", "8", "Kinerja terbaru"]], columns: ["Tugas", "Program", "Prioritas", "Tenggat", "Status"], rows: [["Finalisasi materi belajar", "KSE Mengajar", "Tinggi", "10 Sep 2026", "Dikerjakan"], ["Konfirmasi pembicara", "Sharing Session", "Mendesak", "8 Sep 2026", "Review"], ["Susun daftar peserta", "Welcoming Scholars", "Sedang", "14 Sep 2026", "Belum mulai"]] },
  "/calendar": { eyebrow: "AGENDA", title: "Kalender", description: "Jadwal rapat, program, deadline, dan kegiatan internal.", action: "Tambah agenda", stats: [["Agenda bulan ini", "9", "September 2026"], ["Minggu ini", "3", "Jadwal terdekat"], ["Deadline", "4", "Terkait program"]], columns: ["Agenda", "Jenis", "Tanggal", "Lokasi", "Program"], rows: [["Rapat Pengurus", "Rapat", "8 Sep, 19.00", "Sekretariat", "Organisasi"], ["Sharing Session", "Event", "12 Sep, 15.30", "Aula FEB", "Sharing Session"], ["KSE Mengajar", "Program", "18 Sep, 09.00", "SD Inpres Malalayang", "KSE Mengajar"]] },
  "/inventory": { eyebrow: "ASET ORGANISASI", title: "Inventaris", description: "Kelola ketersediaan, kondisi, dan peminjaman aset.", action: "Tambah barang", stats: [["Total barang", "64", "Semua kategori"], ["Sedang dipinjam", "7", "5 transaksi"], ["Terlambat", "2", "Perlu ditagih"]], columns: ["Kode", "Nama barang", "Tersedia", "Kondisi", "Status"], rows: [["KSE-EL-001", "Kamera Canon EOS", "1 dari 2", "Baik", "Dipinjam"], ["KSE-DK-004", "Tripod kamera", "3 dari 4", "Baik", "Tersedia"], ["KSE-EV-012", "Kabel roll 20m", "2 dari 3", "Rusak ringan", "Tersedia"]] },
  "/activity": { eyebrow: "AUDIT SEDERHANA", title: "Log aktivitas", description: "Riwayat perubahan penting pada sistem organisasi.", action: "Ekspor log", stats: [["Hari ini", "18", "Aktivitas"], ["Minggu ini", "94", "Aktivitas"], ["Pengguna aktif", "16", "Minggu ini"]], columns: ["Pelaku", "Aktivitas", "Entitas", "Waktu", "Status"], rows: [["Ezra Mandagi", "Mengubah status", "KSE Mengajar", "10 menit lalu", "Tercatat"], ["Vinny Moningka", "Mengunggah dokumen", "LPJ Sharing Session", "45 menit lalu", "Tercatat"], ["Miftah Samola", "Menambahkan anggota", "Divisi Education", "2 jam lalu", "Tercatat"]] },
  "/settings": { eyebrow: "SISTEM", title: "Pengaturan", description: "Konfigurasi organisasi, akses, kategori, dan integrasi.", action: "Simpan perubahan", stats: [["Role", "7", "Dapat dikonfigurasi"], ["Permission", "14", "Akses tindakan"], ["Integrasi", "1", "Supabase aktif"]], columns: ["Bagian", "Konfigurasi", "Diperbarui", "Pengelola", "Status"], rows: [["Organisasi", "Identitas KSE Unsrat", "7 Sep 2026", "Super Admin", "Aktif"], ["Roles & Permissions", "7 role, 14 permission", "7 Sep 2026", "Super Admin", "Aktif"], ["Categories", "Program, dokumen, inventaris", "Belum", "Super Admin", "Perlu setup"], ["Integrations", "Supabase dan Google Drive", "7 Sep 2026", "Super Admin", "Sebagian"]] },
};

export function ModuleView({ path, rows: databaseRows }: { path: string; rows?: string[][] }) {
  const module = modules[path];
  const [query, setQuery] = useState("");
  const sourceRows = databaseRows ?? module.rows;
  const rows = useMemo(() => sourceRows.filter(row => row.join(" ").toLowerCase().includes(query.toLowerCase())), [sourceRows, query]);

  return <div className="content module-page">
    <section className="page-heading">
      <div><p>{module.eyebrow}</p><h1>{module.title}</h1><span>{module.description}</span></div>
      <button className="primary-button standalone"><Plus size={18} weight="bold" />{module.action}</button>
    </section>
    <section className="module-stats" aria-label={`Ringkasan ${module.title}`}>
      {module.stats.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </section>
    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Daftar {module.title.toLowerCase()}</h2><p>Data pada periode aktif</p></div><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} aria-label={`Cari ${module.title}`} placeholder="Cari data..." /></label></div>
      <div className="document-table-wrap"><table className="document-table module-table"><thead><tr>{module.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.join("|")}>{row.map((cell, cellIndex) => <td key={module.columns[cellIndex]}>{cellIndex === 0 ? <strong>{cell}</strong> : cellIndex === row.length - 1 ? <em className={cell.includes("Terlambat") || cell.includes("Perlu") ? "review" : "complete"}>{cell}</em> : cell}</td>)}</tr>)}{rows.length === 0 && <tr><td className="empty-table" colSpan={module.columns.length}>{query ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data. Gunakan tombol di atas untuk menambahkan data pertama."}</td></tr>}</tbody></table></div>
    </section>
    {path === "/calendar" && <section className="panel calendar-note"><CalendarBlank size={20} /><div><strong>Tampilan kalender bulanan</strong><p>Akan aktif setelah tabel agenda diterapkan di Supabase.</p></div></section>}
    {path === "/tasks" && <section className="panel calendar-note"><CheckCircle size={20} /><div><strong>Progress otomatis</strong><p>Task berstatus selesai akan menghitung progress program.</p></div></section>}
    {path === "/inventory" && <section className="panel calendar-note"><Clock size={20} /><div><strong>Monitoring peminjaman</strong><p>Barang melewati expected return akan ditandai terlambat.</p></div></section>}
  </div>;
}
