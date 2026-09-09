"use client";

import { CalendarBlank, Lock, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { createAgenda, deleteAgenda, updateAgenda } from "@/app/calendar/actions";
import { agendaTypes, eventTypeLabel } from "@/backend/event-input";
import type { CalendarRow, Option } from "@/backend/calendar-data";

type Dialog = { event: CalendarRow; action: "edit" | "delete" };

export function CalendarView({ events, programs, periodName, upcomingCount, weekCount, attendanceCount, canManage }: {
  events: CalendarRow[]; programs: Option[]; periodName: string;
  upcomingCount: number; weekCount: number; attendanceCount: number; canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"upcoming" | "past" | "all">("upcoming");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [createState, createAction] = useActionState(createAgenda, {});

  const rows = useMemo(() => events.filter(event =>
    (scope === "all" || (scope === "upcoming" ? event.upcoming : !event.upcoming)) &&
    `${event.title} ${event.typeLabel} ${event.programName} ${event.location}`.toLowerCase().includes(query.toLowerCase())
  ), [events, query, scope]);

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Kalender</h1><span>Jadwal rapat, program, tenggat, dan kegiatan internal.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><CalendarBlank size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Agenda selalu menempel pada satu periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Kalender</h1><span>Jadwal rapat, program, tenggat, dan kegiatan internal.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan agenda">
      <article><span>Agenda mendatang</span><strong>{upcomingCount}</strong><small>Periode {periodName}</small></article>
      <article><span>Tujuh hari ke depan</span><strong>{weekCount}</strong><small>Jadwal terdekat</small></article>
      <article><span>Kegiatan kehadiran</span><strong>{attendanceCount}</strong><small>Dikelola di halaman Kehadiran</small></article>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Tambah agenda</h2><p>Waktu dibaca sebagai WITA, sama dengan jam yang kamu ketik.</p></div></div>
      <AgendaFields programs={programs} action={createAction} state={createState} submitLabel="Tambah agenda" icon />
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar agenda</h2><p>{rows.length} dari {events.length} agenda pada periode {periodName}</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari agenda..." aria-label="Cari agenda" /></label>
      </div>
      <div className="panel-heading module-toolbar">
        <label className="table-search"><select value={scope} onChange={event => setScope(event.target.value as typeof scope)} aria-label="Saring waktu agenda">
          <option value="upcoming">Mendatang</option>
          <option value="past">Sudah lewat</option>
          <option value="all">Semua</option>
        </select></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Agenda</th><th>Jenis</th><th>Tanggal</th><th>Waktu</th><th>Lokasi</th><th>Program</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(event => <tr key={event.id}>
            <td><strong>{event.title}</strong></td>
            <td>{event.typeLabel}</td>
            <td>{event.dayLabel}</td>
            <td>{event.timeLabel}</td>
            <td>{event.location || "-"}</td>
            <td>{event.programName}</td>
            {canManage && <td><div className="account-actions">
              {event.managedByAttendance
                ? <span className="account-self" title="Kegiatan kehadiran dikelola di halaman Kehadiran"><Lock size={14} /> Kehadiran</span>
                : <>
                    <button type="button" onClick={() => setSelected({ event, action: "edit" })} title="Ubah" aria-label={`Ubah agenda ${event.title}`}><PencilSimple size={16} /></button>
                    <button className="delete-account" type="button" onClick={() => setSelected({ event, action: "delete" })} title="Hapus" aria-label={`Hapus agenda ${event.title}`}><Trash size={16} /></button>
                  </>}
            </div></td>}
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={canManage ? 7 : 6}><div className="empty-state"><span><CalendarBlank size={21} /></span><div><strong>{query ? "Agenda tidak ditemukan" : scope === "upcoming" ? "Belum ada agenda mendatang" : "Belum ada agenda"}</strong><p>{query ? "Coba kata kunci lain." : "Rapat, tenggat, dan kegiatan internal muncul di sini."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <AgendaDialog event={selected.event} action={selected.action} programs={programs} onClose={() => setSelected(null)} />}
  </div>;
}

function AgendaFields({ programs, action, state, submitLabel, event, icon }: {
  programs: Option[]; action: (form: FormData) => void;
  state: { message?: string; error?: string }; submitLabel: string; event?: CalendarRow; icon?: boolean;
}) {
  return <form action={action}>
    {event && <input type="hidden" name="event_id" value={event.id} />}
    <label>Judul agenda<input name="title" defaultValue={event?.title} required minLength={3} maxLength={120} placeholder="Rapat Pengurus" /></label>
    <label>Jenis<select name="type" defaultValue={event?.type || "meeting"}>{agendaTypes.map(type => <option value={type} key={type}>{eventTypeLabel(type)}</option>)}</select></label>
    <label>Mulai<input name="starts_at" type="datetime-local" defaultValue={event?.startsAtInput} required /></label>
    <label>Selesai<input name="ends_at" type="datetime-local" defaultValue={event?.endsAtInput} /></label>
    <label>Lokasi<input name="location" defaultValue={event?.location} maxLength={120} placeholder="Sekretariat" /></label>
    <label>Program<select name="program_id" defaultValue={event?.programId || ""}><option value="">Organisasi</option>{programs.map(program => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label>
    <label>Catatan<input name="description" defaultValue={event?.description} maxLength={300} /></label>
    <div className="account-submit"><button className="primary-button" type="submit">{icon && <Plus size={17} />}{submitLabel}</button></div>
    {state.message && <p className="inline-message success">{state.message}</p>}
    {state.error && <p className="inline-message error">{state.error}</p>}
  </form>;
}

function AgendaDialog({ event, action, programs, onClose }: { event: CalendarRow; action: Dialog["action"]; programs: Option[]; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updateAgenda : deleteAgenda, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title" onMouseDown={event2 => event2.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="agenda-dialog-title">{action === "edit" ? "Ubah agenda" : "Hapus agenda"}</h2>
      <p>{action === "edit" ? `Perbarui ${event.title}. Waktu dibaca sebagai WITA.` : `Agenda ${event.title} dihapus permanen.`}</p>
      {action === "edit" ? <AgendaFields programs={programs} action={formAction} state={state} submitLabel="Simpan perubahan" event={event} /> : <form action={formAction}>
        <input type="hidden" name="event_id" value={event.id} />
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus agenda</button>
      </form>}
    </section>
  </div>;
}
