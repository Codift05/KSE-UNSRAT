"use client";

import { CalendarBlank, CheckCircle, Clock, MagnifyingGlass, Plus, UserMinus } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createAttendanceEvent, saveAttendance } from "@/app/attendance/actions";
import type { AttendanceEvent, AttendanceMember, AttendanceRecord, AttendanceSummary } from "@/backend/attendance-data";
import { Pagination } from "@/frontend/components/module-view";

export function AttendanceView({ events, members, records, summary, setupRequired }: { events: AttendanceEvent[]; members: AttendanceMember[]; records: AttendanceRecord[]; summary: AttendanceSummary[]; setupRequired: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("present");
  const [mode, setMode] = useState("offline");
  const [eventState, eventAction] = useActionState(createAttendanceEvent, {});
  const [recordState, recordAction] = useActionState(saveAttendance, {});
  const filtered = useMemo(() => summary.filter(item => item.name.toLowerCase().includes(query.toLowerCase())), [query, summary]);
  const pageSize = 10;
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totals = summary.reduce((value, item) => ({ points: value.points + item.totalPoints, present: value.present + item.present, absent: value.absent + item.absent }), { points: 0, present: 0, absent: 0 });

  return <div className="content attendance-page">
    <section className="page-heading"><div><h1>Kehadiran & poin</h1><span>Catat partisipasi kegiatan dan pantau rekap beswan.</span></div></section>

    {setupRequired && <section className="setup-notice" role="status"><strong>Database kehadiran belum disiapkan</strong><p>Jalankan migration <code>202609070003_attendance.sql</code> lalu <code>202609070004_attendance_modes.sql</code> di Supabase SQL Editor.</p></section>}

    <section className="module-stats" aria-label="Ringkasan kehadiran">
      <article><span>Total kegiatan</span><strong>{events.length}</strong><small>Periode aktif</small></article>
      <article><span>Total poin</span><strong>{formatPoints(totals.points)}</strong><small>Seluruh beswan</small></article>
      <article><span>Catatan alpa</span><strong>{totals.absent}</strong><small>Perlu perhatian</small></article>
    </section>

    {!setupRequired && <section className="attendance-forms">
      <details className="panel attendance-form"><summary><Plus size={17} /> Kegiatan baru</summary><form action={eventAction}>
        <label>Nama kegiatan<input name="title" required /></label><label>Waktu kegiatan<input name="starts_at" type="datetime-local" required /></label><label>Pelaksanaan<select name="attendance_mode" value={mode} onChange={event => setMode(event.target.value)}><option value="offline">Offline</option><option value="online">Online</option></select></label>
        <p className="point-rule">Hadir {mode === "offline" ? "20" : "10"} poin · Hadir sebagian {mode === "offline" ? "10" : "5"} poin · Terlambat tetap penuh</p><label>Pengurangan alpa<input name="absent_points" type="number" step="0.5" defaultValue="-10" required /></label>
        <FormMessage state={eventState} /><SaveButton idle="Simpan kegiatan" pending="Menyimpan..." />
      </form></details>
      <details className="panel attendance-form" open><summary><CheckCircle size={17} /> Catat kehadiran</summary><form action={recordAction}>
        <label>Kegiatan<select name="event_id" required defaultValue=""><option value="" disabled>Pilih kegiatan</option>{events.map(event => <option value={event.id} key={event.id}>{event.title} · {event.mode} · {event.date}</option>)}</select></label>
        <label>Beswan<select name="member_id" required defaultValue=""><option value="" disabled>Pilih beswan</option>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label>Status<select name="status" value={status} onChange={event => setStatus(event.target.value)}><option value="present">Hadir penuh</option><option value="late">Terlambat</option><option value="partial">Hadir sebagian</option><option value="permission">Izin</option><option value="absent">Alpa</option></select></label>
        {status === "permission" && <label>Tautan surat izin<input name="permission_url" type="url" placeholder="https://..." /></label>}
        <FormMessage state={recordState} /><SaveButton idle="Simpan kehadiran" pending="Menyimpan..." disabled={!events.length || !members.length} />
      </form></details>
    </section>}

    {!setupRequired && <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Rekap beswan</h2><p>Akumulasi pada periode aktif</p></div><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Cari beswan" placeholder="Cari beswan..." /></label></div>
      <div className="document-table-wrap"><table className="document-table attendance-table"><thead><tr><th>Nama beswan</th><th>Total poin</th><th>Hadir</th><th>Terlambat</th><th>Sebagian</th><th>Izin</th><th>Alpa</th></tr></thead><tbody>
        {rows.map(row => <tr key={row.id}><td><Link className="member-link" href={`/points/${row.id}`}>{row.name}</Link></td><td><strong className={row.totalPoints < 0 ? "negative-points" : ""}>{formatPoints(row.totalPoints)}</strong></td><td><span className="attendance-count"><CheckCircle size={15} />{row.present}</span></td><td>{row.late}</td><td>{row.partial}</td><td><span className="attendance-count"><Clock size={15} />{row.permission}</span></td><td><span className="attendance-count absent"><UserMinus size={15} />{row.absent}</span></td></tr>)}
        {!rows.length && <tr><td className="empty-table" colSpan={7}><div className="empty-state"><span><CalendarBlank size={21} /></span><div><strong>{query ? "Beswan tidak ditemukan" : "Belum ada beswan aktif"}</strong><p>{query ? "Coba kata kunci lain." : "Tambahkan anggota aktif sebelum mencatat kehadiran."}</p></div></div></td></tr>}
      </tbody></table></div>
      {filtered.length > 0 && <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} totalItems={filtered.length} pageSize={pageSize} onPage={setPage} />}
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading"><div><h2>Riwayat terbaru</h2><p>20 perubahan kehadiran terakhir</p></div></div>
      <div className="document-table-wrap"><table className="document-table attendance-table"><thead><tr><th>Kegiatan</th><th>Beswan</th><th>Status</th><th>Poin</th><th>Diperbarui</th></tr></thead><tbody>
        {records.map(record => <tr key={record.id}><td><strong>{record.event}</strong></td><td>{record.member}</td><td><em className={record.status === "Alpa" ? "review" : "complete"}>{record.status}</em></td><td>{record.points > 0 ? "+" : ""}{formatPoints(record.points)}</td><td>{record.updated}</td></tr>)}
        {!records.length && <tr><td className="empty-table" colSpan={5}><div className="empty-state"><div><strong>Belum ada riwayat</strong><p>Catatan terbaru akan tampil setelah kehadiran disimpan.</p></div></div></td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}

const formatPoints = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);

function FormMessage({ state }: { state: { message?: string; error?: string } }) {
  return state.message ? <p className="inline-message success" role="status">{state.message}</p> : state.error ? <p className="inline-message error" role="alert">{state.error}</p> : null;
}

function SaveButton({ idle, pending, disabled = false }: { idle: string; pending: string; disabled?: boolean }) {
  const form = useFormStatus();
  return <button className="primary-button" type="submit" disabled={disabled || form.pending}>{form.pending ? pending : idle}</button>;
}
