"use client";

import { CalendarBlank, CheckCircle, Clock, Database, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type Module = {
  title: string;
  description: string;
  action: string;
  stats: [string, string, string][];
  columns: string[];
  rows: string[][];
};

const modules: Record<string, Module> = {
  "/programs": { title: "Semua program", description: "Monitor progres, penanggung jawab, dan tenggat program.", action: "Program baru", stats: [["Program aktif", "6", "Periode ini"], ["Selesai", "3", "Periode ini"], ["Mendekati tenggat", "2", "Perlu perhatian"]], columns: ["Program", "Divisi", "PIC", "Tenggat", "Status"], rows: [["KSE Mengajar", "Community Development", "Miftah Samola", "18 Sep 2026", "Berjalan"], ["Sharing Session", "Education", "Maria Runtuwene", "24 Sep 2026", "Berjalan"], ["Welcoming Scholars", "Internal Development", "Kevin Sondakh", "2 Okt 2026", "Perencanaan"]] },
  "/tasks": { title: "Tugas saya", description: "Tugas aktif dari seluruh program yang kamu ikuti.", action: "Tambah tugas", stats: [["Belum selesai", "12", "Semua program"], ["Terlambat", "3", "Perlu tindakan"], ["Selesai minggu ini", "8", "Kinerja terbaru"]], columns: ["Tugas", "Program", "Prioritas", "Tenggat", "Status"], rows: [["Finalisasi materi belajar", "KSE Mengajar", "Tinggi", "10 Sep 2026", "Dikerjakan"], ["Konfirmasi pembicara", "Sharing Session", "Mendesak", "8 Sep 2026", "Review"], ["Susun daftar peserta", "Welcoming Scholars", "Sedang", "14 Sep 2026", "Belum mulai"]] },
  "/calendar": { title: "Kalender", description: "Jadwal rapat, program, deadline, dan kegiatan internal.", action: "Tambah agenda", stats: [["Agenda bulan ini", "9", "September 2026"], ["Minggu ini", "3", "Jadwal terdekat"], ["Deadline", "4", "Terkait program"]], columns: ["Agenda", "Jenis", "Tanggal", "Lokasi", "Program"], rows: [["Rapat Pengurus", "Rapat", "8 Sep, 19.00", "Sekretariat", "Organisasi"], ["Sharing Session", "Event", "12 Sep, 15.30", "Aula FEB", "Sharing Session"], ["KSE Mengajar", "Program", "18 Sep, 09.00", "SD Inpres Malalayang", "KSE Mengajar"]] },
  "/inventory": { title: "Inventaris", description: "Kelola ketersediaan, kondisi, dan peminjaman aset.", action: "Tambah barang", stats: [["Total barang", "64", "Semua kategori"], ["Sedang dipinjam", "7", "5 transaksi"], ["Terlambat", "2", "Perlu ditagih"]], columns: ["Kode", "Nama barang", "Tersedia", "Kondisi", "Status"], rows: [["KSE-EL-001", "Kamera Canon EOS", "1 dari 2", "Baik", "Dipinjam"], ["KSE-DK-004", "Tripod kamera", "3 dari 4", "Baik", "Tersedia"], ["KSE-EV-012", "Kabel roll 20m", "2 dari 3", "Rusak ringan", "Tersedia"]] },
  "/activity": { title: "Log aktivitas", description: "Riwayat perubahan penting pada sistem organisasi.", action: "Ekspor log", stats: [["Hari ini", "18", "Aktivitas"], ["Minggu ini", "94", "Aktivitas"], ["Pengguna aktif", "16", "Minggu ini"]], columns: ["Pelaku", "Aktivitas", "Entitas", "Waktu", "Status"], rows: [["Ezra Mandagi", "Mengubah status", "KSE Mengajar", "10 menit lalu", "Tercatat"], ["Vinny Moningka", "Mengunggah dokumen", "LPJ Sharing Session", "45 menit lalu", "Tercatat"], ["Miftah Samola", "Menambahkan anggota", "Divisi Education", "2 jam lalu", "Tercatat"]] },
  "/settings": { title: "Pengaturan", description: "Konfigurasi organisasi, akses, kategori, dan integrasi.", action: "Simpan perubahan", stats: [["Role", "7", "Dapat dikonfigurasi"], ["Permission", "14", "Akses tindakan"], ["Integrasi", "1", "Supabase aktif"]], columns: ["Bagian", "Konfigurasi", "Diperbarui", "Pengelola", "Status"], rows: [["Organisasi", "Identitas KSE Unsrat", "7 Sep 2026", "Super Admin", "Aktif"], ["Roles & Permissions", "7 role, 14 permission", "7 Sep 2026", "Super Admin", "Aktif"], ["Categories", "Program, dokumen, inventaris", "Belum", "Super Admin", "Perlu setup"], ["Integrations", "Supabase dan Google Drive", "7 Sep 2026", "Super Admin", "Sebagian"]] },
};

export function ModuleView({ path, rows: databaseRows }: { path: string; rows?: string[][] }) {
  const module = modules[path];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const sourceRows = databaseRows ?? module.rows;
  const filteredRows = useMemo(() => sourceRows.filter(row => row.join(" ").toLowerCase().includes(query.toLowerCase())), [sourceRows, query]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return <div className="content module-page">
    <section className="page-heading">
      <div><h1>{module.title}</h1><span>{module.description}</span></div>
      <button className="primary-button standalone"><Plus size={18} weight="bold" />{module.action}</button>
    </section>
    <section className="module-stats" aria-label={`Ringkasan ${module.title}`}>
      {module.stats.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </section>
    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Daftar {module.title.toLowerCase()}</h2><p>Data pada periode aktif</p></div><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label={`Cari ${module.title}`} placeholder="Cari data..." /></label></div>
      <div className="document-table-wrap"><table className="document-table module-table"><thead><tr>{module.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.join("|")}>{row.map((cell, cellIndex) => <td key={module.columns[cellIndex]}>{cellIndex === 0 ? <strong>{cell}</strong> : cellIndex === row.length - 1 ? <em className={cell.includes("Terlambat") || cell.includes("Perlu") ? "review" : "complete"}>{cell}</em> : cell}</td>)}</tr>)}{rows.length === 0 && <tr><td className="empty-table" colSpan={module.columns.length}><div className="empty-state"><span><Database size={21} /></span><div><strong>{query ? "Data tidak ditemukan" : `Belum ada ${module.title.toLowerCase()}`}</strong><p>{query ? "Coba kata kunci lain atau hapus pencarian." : `Gunakan tombol ${module.action} untuk membuat data pertama.`}</p></div></div></td></tr>}</tbody></table></div>
      {filteredRows.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPage={setPage} />}
    </section>
    {path === "/calendar" && <section className="panel calendar-note"><CalendarBlank size={20} /><div><strong>Tampilan kalender bulanan</strong><p>Akan aktif setelah tabel agenda diterapkan di Supabase.</p></div></section>}
    {path === "/tasks" && <section className="panel calendar-note"><CheckCircle size={20} /><div><strong>Progress otomatis</strong><p>Task berstatus selesai akan menghitung progress program.</p></div></section>}
    {path === "/inventory" && <section className="panel calendar-note"><Clock size={20} /><div><strong>Monitoring peminjaman</strong><p>Barang melewati expected return akan ditandai terlambat.</p></div></section>}
  </div>;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPage }: { page: number; totalPages: number; totalItems: number; pageSize: number; onPage: (page: number) => void }) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return <nav className="pagination" aria-label="Navigasi halaman tabel"><span>Menampilkan {first}-{last} dari {totalItems}</span><div><button onClick={() => onPage(page - 1)} disabled={page === 1}>Sebelumnya</button><strong>{page} / {totalPages}</strong><button onClick={() => onPage(page + 1)} disabled={page === totalPages}>Berikutnya</button></div></nav>;
}
