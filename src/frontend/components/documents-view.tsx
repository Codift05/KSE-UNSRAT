"use client";

import { CloudSlash, FileText, FolderOpen, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Pagination } from "@/frontend/components/pagination";
import type { DocumentRow } from "@/backend/dashboard-data";

export function DocumentsView({ rows, driveConfigured }: { rows: DocumentRow[]; driveConfigured: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = useMemo(() => rows.filter(item =>
    (!category || item.category === category) &&
    Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
  ), [rows, query, category]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const categories = useMemo(() => [...new Set(rows.map(row => row.category).filter(value => value && value !== "-"))].sort(), [rows]);

  return <div className="content documents-page">
    <section className="page-heading">
      <div><h1>Dokumen</h1><span>Monitor kelengkapan dan akses seluruh dokumentasi KSE Unsrat.</span></div>
      <button className="primary-button standalone" disabled={!driveConfigured} title={driveConfigured ? "Tambah dokumen" : "Hubungkan Google Drive lebih dulu"}><Plus size={18} weight="bold" />Tambah dokumen</button>
    </section>

    <section className="document-summary" aria-label="Ringkasan dokumen">
      <div><span>Total dokumen</span><strong>{rows.length}</strong><small>Periode aktif</small></div>
      <div><span>Dokumen lengkap</span><strong>{rows.filter(item => item.status === "Lengkap").length}</strong><small>Metadata terindeks</small></div>
      <div><span>Perlu ditinjau</span><strong>{rows.filter(item => item.status !== "Lengkap").length}</strong><small>Menunggu verifikasi</small></div>
      <div className="drive-state"><span>Status penyimpanan</span><strong>Google Drive</strong><small>{driveConfigured ? "Tersambung" : "Belum tersambung"}</small></div>
    </section>

    <section className="panel document-library">
      <div className="panel-heading document-toolbar">
        <div><h2>Semua dokumen</h2><p>Metadata arsip pada periode aktif</p></div>
        <div className="document-actions">
          <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Cari dokumen" placeholder="Cari dokumen..." /></label>
          <select aria-label="Filter kategori" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}>
            <option value="">Semua kategori</option>
            {categories.map(item => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="document-table-wrap"><table className="document-table">
        <thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Program</th><th>Pengunggah</th><th>Diperbarui</th><th>Status</th></tr></thead>
        <tbody>
          {visibleRows.map(doc => <tr key={`${doc.title}-${doc.updated}`}>
            <td><span className="file-icon"><FileText size={18} /></span><strong>{doc.title}</strong></td>
            <td>{doc.category}</td><td>{doc.program}</td><td>{doc.owner}</td><td>{doc.updated}</td>
            <td><em className={doc.status === "Lengkap" ? "complete" : "review"}>{doc.status}</em></td>
          </tr>)}
          {!visibleRows.length && <tr><td className="empty-table" colSpan={6}><div className="empty-state"><span><FolderOpen size={21} /></span><div><strong>{query || category ? "Dokumen tidak ditemukan" : "Belum ada dokumen"}</strong><p>{query || category ? "Ubah pencarian atau filter kategori." : "Hubungkan Google Drive, lalu tambahkan dokumen pertama."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
      {filteredRows.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPage={setPage} />}
    </section>

    <section className="panel folder-panel">
      <div className="panel-heading"><div><h2>Folder dokumentasi kegiatan</h2><p>Foto dan video disimpan langsung di Google Drive</p></div></div>
      <div className="empty-state"><span><CloudSlash size={21} /></span><div>
        <strong>Google Drive belum terhubung</strong>
        <p>Folder per program dibuat otomatis setelah credential Drive dipasang. Sampai saat itu, unggahan dokumen belum tersedia.</p>
      </div></div>
    </section>
  </div>;
}
