"use client";

import { CalendarBlank, CheckCircle, Clock, Copy, MapPin, MagnifyingGlass, Plus, UserMinus } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createAttendanceEvent, openAttendanceSession, saveAttendance, verifySelfAttendance } from "@/app/attendance/actions";
import type { AttendanceEvent, AttendanceMember, AttendanceRecord, AttendanceSummary } from "@/backend/attendance-data";
import { Pagination } from "@/frontend/components/module-view";

export function AttendanceView({ events, members, records, pendingRecords, summary, setupRequired }: { events: AttendanceEvent[]; members: AttendanceMember[]; records: AttendanceRecord[]; pendingRecords: AttendanceRecord[]; summary: AttendanceSummary[]; setupRequired: boolean }) {
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

    {setupRequired && <section className="setup-notice" role="status"><strong>Database kehadiran belum disiapkan</strong><p>Jalankan migration kehadiran <code>202609070003</code> sampai <code>202609070006</code> di Supabase SQL Editor.</p></section>}

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
      <SessionForm events={events} />
    </section>}

    {!setupRequired && pendingRecords.length > 0 && <section className="panel module-table-panel">
      <div className="panel-heading"><div><h2>Menunggu verifikasi</h2><p>Absensi mandiri belum memberikan poin</p></div></div>
      <div className="document-table-wrap"><table className="document-table attendance-table verification-table"><thead><tr><th>Beswan</th><th>Kegiatan</th><th>Check-in</th><th>Check-out</th><th>Jarak</th><th>Keputusan</th></tr></thead><tbody>
        {pendingRecords.map(record => <tr key={record.id}><td><strong>{record.member}</strong></td><td>{record.event}</td><td>{record.checkIn || "-"}</td><td>{record.checkOut || "-"}</td><td title={record.note || undefined}>{record.accuracy !== null && record.accuracy > 200 ? `Akurasi rendah · ${Math.round(record.accuracy)} m` : record.distance === null ? "Online" : `${Math.round(record.distance)} m`}</td><td><form className="verify-actions" action={verifySelfAttendance}><input type="hidden" name="record_id" value={record.id} /><select name="status" defaultValue={record.rawStatus}><option value="present">Hadir</option><option value="late">Terlambat</option><option value="partial">Sebagian</option><option value="permission">Izin</option><option value="absent">Alpa</option></select><button name="decision" value="verified">Setujui</button><button className="reject-button" name="decision" value="rejected">Tolak</button></form></td></tr>)}
      </tbody></table></div>
    </section>}

    {!setupRequired && <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Peringkat beswan</h2><p>Urutan poin dan tingkat keaktifan periode aktif</p></div><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Cari beswan" placeholder="Cari beswan..." /></label></div>
      <div className="document-table-wrap"><table className="document-table attendance-table leaderboard-table"><thead><tr><th>Peringkat</th><th>Nama beswan</th><th>Total poin</th><th>Keaktifan</th><th>Status anggota</th><th>Peringatan</th><th>Hadir</th><th>Terlambat</th><th>Sebagian</th><th>Izin</th><th>Alpa</th></tr></thead><tbody>
        {rows.map(row => <tr key={row.id}><td><strong>#{row.rank}</strong></td><td><Link className="member-link" href={`/points/${row.id}`}>{row.name}</Link></td><td><strong className={row.totalPoints < 0 ? "negative-points" : ""}>{formatPoints(row.totalPoints)}</strong></td><td><em className={`standing ${activityClass(row.activity)}`}>{row.activity}</em></td><td>{row.memberStatus}</td><td><em className={`standing ${row.warning === "Aman" ? "safe" : "warning"}`}>{row.warning}</em></td><td><span className="attendance-count"><CheckCircle size={15} />{row.present}</span></td><td>{row.late}</td><td>{row.partial}</td><td><span className="attendance-count"><Clock size={15} />{row.permission}</span></td><td><span className="attendance-count absent"><UserMinus size={15} />{row.absent}</span></td></tr>)}
        {!rows.length && <tr><td className="empty-table" colSpan={11}><div className="empty-state"><span><CalendarBlank size={21} /></span><div><strong>{query ? "Beswan tidak ditemukan" : "Belum ada beswan"}</strong><p>{query ? "Coba kata kunci lain." : "Tambahkan anggota sebelum mencatat kehadiran."}</p></div></div></td></tr>}
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

function SessionForm({ events }: { events: AttendanceEvent[] }) {
  const [state, action] = useActionState(openAttendanceSession, {});
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const selected = events.find(event => event.id === eventId);
  const locate = () => navigator.geolocation.getCurrentPosition(position => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setLocation(null), { enableHighAccuracy: true, timeout: 10000 });
  const copy = () => state.link && navigator.clipboard.writeText(`${window.location.origin}${state.link}`);
  return <details className="panel attendance-form session-form"><summary><MapPin size={17} /> Buka sesi mandiri</summary><form action={action}>
    <label>Kegiatan<select name="event_id" value={eventId} onChange={event => setEventId(event.target.value)} required>{events.map(event => <option value={event.id} key={event.id}>{event.title} · {event.mode}</option>)}</select></label>
    {selected?.mode === "Offline" && <><input type="hidden" name="latitude" value={location?.latitude || ""} /><input type="hidden" name="longitude" value={location?.longitude || ""} /><button className="location-button" type="button" onClick={locate}><MapPin size={16} />{location ? "Lokasi kegiatan tersimpan" : "Gunakan lokasi saya"}</button><label>Radius lokasi (meter)<input name="radius" type="number" min="25" max="1000" defaultValue="150" required /></label></>}
    {selected?.mode === "Online" && <input name="radius" type="hidden" value="150" />}
    <div className="session-fields"><label>Aktif (menit)<input name="duration" type="number" min="5" max="180" defaultValue="15" required /></label><label>Terlambat setelah<input name="late_after" type="number" min="0" max="180" defaultValue="15" required /></label><label>Minimal hadir<input name="min_presence" type="number" min="0" max="600" defaultValue="30" required /></label></div>
    <FormMessage state={state} /><SaveButton idle="Buka sesi" pending="Membuka..." disabled={!events.length || (selected?.mode === "Offline" && !location)} />
    {state.link && <div className="session-result"><div><span>Link absensi</span><strong>{state.link}</strong></div><div><span>Kode kegiatan</span><strong>{state.code}</strong></div><button type="button" onClick={copy}><Copy size={16} />Salin link</button></div>}
  </form></details>;
}

const formatPoints = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
const activityClass = (activity: string) => activity === "Sangat aktif" ? "high" : activity === "Aktif" ? "safe" : activity === "Kurang aktif" ? "warning" : "neutral";

function FormMessage({ state }: { state: { message?: string; error?: string } }) {
  return state.message ? <p className="inline-message success" role="status">{state.message}</p> : state.error ? <p className="inline-message error" role="alert">{state.error}</p> : null;
}

function SaveButton({ idle, pending, disabled = false }: { idle: string; pending: string; disabled?: boolean }) {
  const form = useFormStatus();
  return <button className="primary-button" type="submit" disabled={disabled || form.pending}>{form.pending ? pending : idle}</button>;
}
