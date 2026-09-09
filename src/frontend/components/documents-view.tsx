"use client";

import { ArrowSquareOut, CloudSlash, FileText, FolderOpen, MagnifyingGlass, Trash, UploadSimple, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { deleteDocument, uploadDocument } from "@/app/documents/actions";
import { Pagination } from "@/frontend/components/pagination";
import type { DocumentRow, Option } from "@/backend/documents-data";

export function DocumentsView({ documents, categories, programs, periodName, canUpload, canDeleteAny, driveConfigured }: {
  documents: DocumentRow[]; categories: Option[]; programs: Option[]; periodName: string;
  canUpload: boolean; canDeleteAny: boolean; driveConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [uploadState, uploadAction] = useActionState(uploadDocument, {});
  const pageSize = 10;

  const filteredRows = useMemo(() => documents.filter(item =>
    (!category || item.category === category) &&
    `${item.title} ${item.category} ${item.program} ${item.owner}`.toLowerCase().includes(query.toLowerCase())
  ), [documents, query, category]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const usedCategories = useMemo(() => [...new Set(documents.map(row => row.category))].sort(), [documents]);

  return <div className="content documents-page">
    <section className="page-heading">
      <div><h1>Dokumen</h1><span>Monitor kelengkapan dan akses seluruh dokumentasi KSE Unsrat.</span></div>
    </section>

    <section className="document-summary" aria-label="Ringkasan dokumen">
      <div><span>Total dokumen</span><strong>{documents.length}</strong><small>{periodName ? `Periode ${periodName}` : "Belum ada periode aktif"}</small></div>
      <div><span>Dokumen lengkap</span><strong>{documents.filter(item => item.status === "Lengkap").length}</strong><small>Metadata terindeks</small></div>
      <div><span>Perlu ditinjau</span><strong>{documents.filter(item => item.status !== "Lengkap").length}</strong><small>Belum berkategori</small></div>
      <div className="drive-state"><span>Status penyimpanan</span><strong>Google Drive</strong><small>{driveConfigured ? "Tersambung" : "Belum tersambung"}</small></div>
    </section>

    {canUpload && driveConfigured && periodName && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Unggah dokumen</h2><p>Berkas disimpan di Drive, metadatanya di sistem. Folder dibuat otomatis menurut periode, program, dan kategori.</p></div></div>
      <form action={uploadAction}>
        <label>Judul dokumen<input name="title" required minLength={3} maxLength={140} placeholder="Proposal KSE Mengajar" /></label>
        <label>Kategori<select name="category_id" defaultValue=""><option value="">Tanpa kategori</option>{categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Program<select name="program_id" defaultValue=""><option value="">Organisasi</option>{programs.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Visibilitas<select name="visibility" defaultValue="members"><option value="members">Semua anggota</option><option value="management">Pengurus</option><option value="private">Pribadi</option></select></label>
        <label>Berkas<input name="file" type="file" required /></label>
        <label>Catatan<input name="description" maxLength={300} /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><UploadSimple size={17} />Unggah</button></div>
        {uploadState.message && <p className="inline-message success">{uploadState.message}</p>}
        {uploadState.error && <p className="inline-message error">{uploadState.error}</p>}
      </form>
    </section>}

    {!driveConfigured && <section className="panel module-table-panel">
      <div className="empty-state"><span><CloudSlash size={21} /></span><div>
        <strong>Google Drive belum terhubung</strong>
        <p>Unggahan dokumen tersedia setelah credential Drive dipasang. Metadata yang sudah ada tetap dapat dicari di bawah.</p>
      </div></div>
    </section>}

    <section className="panel document-library">
      <div className="panel-heading document-toolbar">
        <div><h2>Semua dokumen</h2><p>Metadata arsip pada periode aktif</p></div>
        <div className="document-actions">
          <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Cari dokumen" placeholder="Cari dokumen..." /></label>
          <select aria-label="Filter kategori" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}>
            <option value="">Semua kategori</option>
            {usedCategories.map(item => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="document-table-wrap"><table className="document-table">
        <thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Program</th><th>Pengunggah</th><th>Akses</th><th>Diunggah</th><th>Status</th><th>Kontrol</th></tr></thead>
        <tbody>
          {visibleRows.map(doc => <tr key={doc.id}>
            <td><span className="file-icon"><FileText size={18} /></span><strong>{doc.title}</strong></td>
            <td>{doc.category}</td>
            <td>{doc.program}</td>
            <td>{doc.owner}{doc.mine ? " · kamu" : ""}</td>
            <td>{doc.visibilityLabel}</td>
            <td>{doc.updated}</td>
            <td><em className={doc.status === "Lengkap" ? "complete" : "review"}>{doc.status}</em></td>
            <td><div className="account-actions">
              {doc.driveLink && <a href={doc.driveLink} target="_blank" rel="noopener noreferrer" title="Buka di Drive" aria-label={`Buka ${doc.title} di Google Drive`}><ArrowSquareOut size={16} /></a>}
              {(doc.mine || canDeleteAny) && <button className="delete-account" type="button" onClick={() => setSelected(doc)} title="Hapus" aria-label={`Hapus ${doc.title}`}><Trash size={16} /></button>}
            </div></td>
          </tr>)}
          {!visibleRows.length && <tr><td className="empty-table" colSpan={8}><div className="empty-state"><span><FolderOpen size={21} /></span><div><strong>{query || category ? "Dokumen tidak ditemukan" : "Belum ada dokumen"}</strong><p>{query || category ? "Ubah pencarian atau filter kategori." : driveConfigured ? "Unggah dokumen pertama lewat formulir di atas." : "Hubungkan Google Drive lebih dulu."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
      {filteredRows.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPage={setPage} />}
    </section>

    {selected && <DeleteDialog document={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function DeleteDialog({ document, onClose }: { document: DocumentRow; onClose: () => void }) {
  const [state, formAction] = useActionState(deleteDocument, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="document-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="document-dialog-title">Hapus dokumen</h2>
      <p>{document.title} dihapus dari sistem dan berkasnya ikut dihapus dari Google Drive.</p>
      <form action={formAction}>
        <input type="hidden" name="document_id" value={document.id} />
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus dokumen</button>
      </form>
    </section>
  </div>;
}
