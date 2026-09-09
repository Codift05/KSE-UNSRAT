"use client";

import { List, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Pagination } from "@/frontend/components/module-view";
import type { ActivityRow } from "@/backend/activity-data";

export function ActivityView({ entries, entityTypes, todayCount, weekCount, activeActors }: {
  entries: ActivityRow[]; entityTypes: { type: string; label: string }[];
  todayCount: number; weekCount: number; activeActors: number;
}) {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => entries.filter(entry =>
    (!entityType || entry.entityType === entityType) &&
    `${entry.actorName} ${entry.action} ${entry.entityLabel}`.toLowerCase().includes(query.toLowerCase())
  ), [entries, query, entityType]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Log aktivitas</h1><span>Riwayat perubahan penting pada sistem organisasi.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan aktivitas">
      <article><span>Hari ini</span><strong>{todayCount}</strong><small>Aktivitas tercatat</small></article>
      <article><span>Tujuh hari terakhir</span><strong>{weekCount}</strong><small>Aktivitas tercatat</small></article>
      <article><span>Pengguna aktif</span><strong>{activeActors}</strong><small>Tujuh hari terakhir</small></article>
    </section>

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Riwayat</h2><p>{entries.length} catatan terbaru{filtered.length !== entries.length ? ` · ${filtered.length} sesuai saringan` : ""}</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => reset(setQuery)(event.target.value)} placeholder="Cari aktivitas..." aria-label="Cari aktivitas" /></label>
      </div>
      <div className="panel-heading module-toolbar">
        <label className="table-search"><select value={entityType} onChange={event => reset(setEntityType)(event.target.value)} aria-label="Saring jenis entitas">
          <option value="">Semua jenis</option>
          {entityTypes.map(entity => <option value={entity.type} key={entity.type}>{entity.label}</option>)}
        </select></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Pelaku</th><th>Aktivitas</th><th>Jenis</th><th>Waktu</th></tr></thead>
        <tbody>
          {rows.map(entry => <tr key={entry.id}>
            <td><strong>{entry.actorName}</strong></td>
            <td>{entry.action}</td>
            <td>{entry.entityLabel}</td>
            <td><span title={entry.stampLabel}>{entry.timeLabel}</span></td>
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={4}><div className="empty-state"><span><List size={21} /></span><div><strong>{query || entityType ? "Aktivitas tidak ditemukan" : "Belum ada aktivitas"}</strong><p>{query || entityType ? "Coba kata kunci atau saringan lain." : "Perubahan penting pada sistem tercatat di sini."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
      {filtered.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPage={setPage} />}
    </section>
  </div>;
}
