"use client";

import { Archive, CheckCircle, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { activatePeriod, archivePeriod, createPeriod, deletePeriod, updatePeriod } from "@/app/periods/actions";
import type { PeriodRow } from "@/backend/periods-data";

type Dialog = { period: PeriodRow; action: "edit" | "delete" };

export function PeriodsView({ periods, activeName, archivedCount, canManage }: { periods: PeriodRow[]; activeName: string; archivedCount: number; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [createState, createAction] = useActionState(createPeriod, {});
  const rows = useMemo(() => periods.filter(period => `${period.name} ${period.rangeLabel}`.toLowerCase().includes(query.toLowerCase())), [periods, query]);

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Periode</h1><span>Kelola masa kepengurusan dan histori organisasi.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan periode">
      <article><span>Periode aktif</span><strong>{activeName}</strong><small>Hanya satu periode aktif</small></article>
      <article><span>Periode arsip</span><strong>{archivedCount}</strong><small>Data tetap tersimpan</small></article>
      <article><span>Total periode</span><strong>{periods.length}</strong><small>Seluruh histori</small></article>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Buat periode</h2><p>Periode baru dibuat sebagai draft dan belum menggantikan periode aktif.</p></div></div>
      <form action={createAction}>
        <label>Nama periode<input name="name" placeholder="2026-2027" required minLength={4} maxLength={40} /></label>
        <label>Tanggal mulai<input name="starts_on" type="date" required /></label>
        <label>Tanggal selesai<input name="ends_on" type="date" required /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><Plus size={17} />Buat periode</button></div>
        {createState.message && <p className="inline-message success">{createState.message}</p>}
        {createState.error && <p className="inline-message error">{createState.error}</p>}
      </form>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar periode</h2><p>{periods.length} periode tercatat</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari periode..." aria-label="Cari periode" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Periode</th><th>Rentang</th><th>Divisi</th><th>Pengurus</th><th>Status</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(period => <PeriodItem period={period} canManage={canManage} onSelect={action => setSelected({ period, action })} key={period.id} />)}
          {!rows.length && <tr><td className="empty-table" colSpan={canManage ? 6 : 5}><div className="empty-state"><span><Archive size={21} /></span><div><strong>{query ? "Periode tidak ditemukan" : "Belum ada periode"}</strong><p>{query ? "Coba kata kunci lain." : "Buat periode pertama untuk mulai mencatat kepengurusan."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <PeriodDialog period={selected.period} action={selected.action} onClose={() => setSelected(null)} />}
  </div>;
}

function PeriodItem({ period, canManage, onSelect }: { period: PeriodRow; canManage: boolean; onSelect: (action: Dialog["action"]) => void }) {
  return <tr>
    <td><strong>{period.name}</strong></td>
    <td>{period.rangeLabel}</td>
    <td>{period.divisionCount} divisi</td>
    <td>{period.managementCount} pengurus</td>
    <td><em className={period.status === "Aktif" ? "complete" : "review"}>{period.status}</em></td>
    {canManage && <td><div className="account-actions">
      {period.status !== "Aktif" && <form action={activatePeriod}><input type="hidden" name="period_id" value={period.id} /><button title="Jadikan periode aktif" aria-label={`Aktifkan periode ${period.name}`}><CheckCircle size={16} /></button></form>}
      {period.status !== "Diarsipkan" && <form action={archivePeriod}><input type="hidden" name="period_id" value={period.id} /><button title="Arsipkan" aria-label={`Arsipkan periode ${period.name}`}><Archive size={16} /></button></form>}
      <button type="button" onClick={() => onSelect("edit")} title="Ubah" aria-label={`Ubah periode ${period.name}`}><PencilSimple size={16} /></button>
      <button className="delete-account" type="button" onClick={() => onSelect("delete")} title="Hapus" aria-label={`Hapus periode ${period.name}`}><Trash size={16} /></button>
    </div></td>}
  </tr>;
}

function PeriodDialog({ period, action, onClose }: { period: PeriodRow; action: Dialog["action"]; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updatePeriod : deletePeriod, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="period-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="period-dialog-title">{action === "edit" ? "Ubah periode" : "Hapus periode"}</h2>
      <p>{action === "edit" ? `Perbarui nama dan rentang tanggal ${period.name}.` : `Divisi, kepengurusan, dan program pada ${period.name} ikut terhapus permanen.`}</p>
      <form action={formAction}>
        <input type="hidden" name="period_id" value={period.id} />
        {action === "edit" ? <>
          <label>Nama periode<input name="name" defaultValue={period.name} autoFocus required minLength={4} maxLength={40} /></label>
          <label>Tanggal mulai<input name="starts_on" type="date" defaultValue={period.startsOn} required /></label>
          <label>Tanggal selesai<input name="ends_on" type="date" defaultValue={period.endsOn} required /></label>
        </> : <label>Ketik HAPUS untuk melanjutkan<input name="confirmation" autoFocus required /></label>}
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className={action === "delete" ? "danger-button" : "primary-button"}>{action === "edit" ? "Simpan perubahan" : "Hapus periode"}</button>
      </form>
    </section>
  </div>;
}
