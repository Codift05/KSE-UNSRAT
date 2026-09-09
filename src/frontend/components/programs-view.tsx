"use client";

import { ArchiveBoxIcon as ArchiveBox, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { createProgram, deleteProgram, updateProgram } from "@/app/programs/actions";
import { priorities, priorityLabel, programStatuses, programStatusLabel } from "@/backend/program-input";
import type { Option, ProgramRow } from "@/backend/programs-data";

type Dialog = { program: ProgramRow; action: "edit" | "delete" };

export function ProgramsView({ programs, divisions, members, periodName, ongoingCount, completedCount, unassignedCount, canCreate, canUpdate, canDelete }: {
  programs: ProgramRow[]; divisions: Option[]; members: Option[]; periodName: string;
  ongoingCount: number; completedCount: number; unassignedCount: number;
  canCreate: boolean; canUpdate: boolean; canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [createState, createAction] = useActionState(createProgram, {});
  const rows = useMemo(() => programs.filter(program => `${program.name} ${program.divisionName} ${program.picName} ${program.statusLabel}`.toLowerCase().includes(query.toLowerCase())), [programs, query]);
  const canControl = canUpdate || canDelete;

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Semua program</h1><span>Monitor progres, penanggung jawab, dan tenggat program.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><ArchiveBox size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Program selalu menempel pada satu periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Semua program</h1><span>Monitor progres, penanggung jawab, dan tenggat program.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan program">
      <article><span>Program berjalan</span><strong>{ongoingCount}</strong><small>Periode {periodName}</small></article>
      <article><span>Selesai</span><strong>{completedCount}</strong><small>Periode ini</small></article>
      <article><span>Tanpa PIC</span><strong>{unassignedCount}</strong><small>Perlu ditetapkan</small></article>
    </section>

    {canCreate && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Program baru</h2><p>Progress dihitung otomatis dari tugas yang selesai.</p></div></div>
      <ProgramFields divisions={divisions} members={members} action={createAction} state={createState} submitLabel="Buat program" icon />
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar program</h2><p>{programs.length} program pada periode {periodName}</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari program..." aria-label="Cari program" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Program</th><th>Divisi</th><th>PIC</th><th>Progress</th><th>Tenggat</th><th>Prioritas</th><th>Status</th>{canControl && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(program => <tr key={program.id}>
            <td><strong>{program.name}</strong></td>
            <td>{program.divisionName}</td>
            <td>{program.picName}</td>
            <td>{program.progress}% <small>({program.doneTasks}/{program.totalTasks} tugas)</small></td>
            <td>{program.dueLabel}</td>
            <td>{program.priorityLabel}</td>
            <td><em className={program.status === "completed" ? "complete" : program.status === "cancelled" ? "review" : "complete"}>{program.statusLabel}</em></td>
            {canControl && <td><div className="account-actions">
              {canUpdate && <button type="button" onClick={() => setSelected({ program, action: "edit" })} title="Ubah" aria-label={`Ubah program ${program.name}`}><PencilSimple size={16} /></button>}
              {canDelete && <button className="delete-account" type="button" onClick={() => setSelected({ program, action: "delete" })} title="Hapus" aria-label={`Hapus program ${program.name}`}><Trash size={16} /></button>}
            </div></td>}
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={canControl ? 8 : 7}><div className="empty-state"><span><ArchiveBox size={21} /></span><div><strong>{query ? "Program tidak ditemukan" : "Belum ada program"}</strong><p>{query ? "Coba kata kunci lain." : `Buat program pertama untuk periode ${periodName}.`}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <ProgramDialog program={selected.program} action={selected.action} divisions={divisions} members={members} onClose={() => setSelected(null)} />}
  </div>;
}

function ProgramFields({ divisions, members, action, state, submitLabel, program, icon }: {
  divisions: Option[]; members: Option[]; action: (form: FormData) => void;
  state: { message?: string; error?: string }; submitLabel: string; program?: ProgramRow; icon?: boolean;
}) {
  return <form action={action}>
    {program && <input type="hidden" name="program_id" value={program.id} />}
    <label>Nama program<input name="name" defaultValue={program?.name} required minLength={3} maxLength={100} placeholder="KSE Mengajar" /></label>
    <label>Divisi<select name="division_id" defaultValue={program?.divisionId || ""}><option value="">Lintas divisi</option>{divisions.map(division => <option value={division.id} key={division.id}>{division.name}</option>)}</select></label>
    <label>Penanggung jawab<select name="pic_id" defaultValue={program?.picId || ""}><option value="">Belum ditetapkan</option>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
    <label>Tanggal mulai<input name="starts_on" type="date" defaultValue={program?.startsOn} /></label>
    <label>Tenggat<input name="ends_on" type="date" defaultValue={program?.endsOn} /></label>
    <label>Status<select name="status" defaultValue={program?.status || "planning"}>{programStatuses.map(status => <option value={status} key={status}>{programStatusLabel(status)}</option>)}</select></label>
    <label>Prioritas<select name="priority" defaultValue={program?.priority || "medium"}>{priorities.map(priority => <option value={priority} key={priority}>{priorityLabel(priority)}</option>)}</select></label>
    <label>Anggaran<input name="budget" defaultValue={program ? String(program.budget) : ""} inputMode="numeric" placeholder="0" /></label>
    <label>Deskripsi<input name="description" defaultValue={program?.description} maxLength={300} /></label>
    <div className="account-submit"><button className="primary-button" type="submit">{icon && <Plus size={17} />}{submitLabel}</button></div>
    {state.message && <p className="inline-message success">{state.message}</p>}
    {state.error && <p className="inline-message error">{state.error}</p>}
  </form>;
}

function ProgramDialog({ program, action, divisions, members, onClose }: { program: ProgramRow; action: Dialog["action"]; divisions: Option[]; members: Option[]; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updateProgram : deleteProgram, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="program-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="program-dialog-title">{action === "edit" ? "Ubah program" : "Hapus program"}</h2>
      <p>{action === "edit" ? `Perbarui data ${program.name}.` : program.totalTasks ? `${program.totalTasks} tugas di dalam program ini ikut terhapus.` : `Program ${program.name} belum punya tugas.`}</p>
      {action === "edit" ? <ProgramFields divisions={divisions} members={members} action={formAction} state={state} submitLabel="Simpan perubahan" program={program} /> : <form action={formAction}>
        <input type="hidden" name="program_id" value={program.id} />
        {program.totalTasks ? <label>Ketik HAPUS untuk melanjutkan<input name="confirmation" autoFocus required /></label> : null}
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus program</button>
      </form>}
    </section>
  </div>;
}
