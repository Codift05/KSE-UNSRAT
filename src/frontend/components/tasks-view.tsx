"use client";

import { CheckCircle, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { createTask, deleteTask, updateTask } from "@/app/tasks/actions";
import { priorities, priorityLabel, taskStatuses, taskStatusLabel } from "@/backend/program-input";
import type { Option, TaskRow } from "@/backend/tasks-data";

type Dialog = { task: TaskRow; action: "edit" | "delete" };

export function TasksView({ tasks, programs, members, periodName, scopeLabel, pendingCount, overdueCount, doneCount, canCreate, canAssign, currentUserId }: {
  tasks: TaskRow[]; programs: Option[]; members: Option[]; periodName: string; scopeLabel: string;
  pendingCount: number; overdueCount: number; doneCount: number;
  canCreate: boolean; canAssign: boolean; currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [createState, createAction] = useActionState(createTask, {});
  const rows = useMemo(() => tasks.filter(task => `${task.title} ${task.programName} ${task.assigneeName} ${task.statusLabel}`.toLowerCase().includes(query.toLowerCase())), [tasks, query]);

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Tugas</h1><span>Tugas aktif dari seluruh program periode berjalan.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><CheckCircle size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Tugas</h1><span>{scopeLabel} pada periode {periodName}.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan tugas">
      <article><span>Belum selesai</span><strong>{pendingCount}</strong><small>{scopeLabel}</small></article>
      <article><span>Terlambat</span><strong>{overdueCount}</strong><small>Lewat tenggat</small></article>
      <article><span>Selesai</span><strong>{doneCount}</strong><small>Periode ini</small></article>
    </section>

    {canCreate && (programs.length ? <section className="panel account-create">
      <div className="panel-heading"><div><h2>Tugas baru</h2><p>Setiap tugas melekat pada satu program.</p></div></div>
      <TaskFields programs={programs} members={members} action={createAction} state={createState} submitLabel="Tambah tugas" canAssign={canAssign} icon />
    </section> : <section className="panel module-table-panel"><div className="empty-state"><span><CheckCircle size={21} /></span><div><strong>Belum ada program</strong><p>Tugas melekat pada program, jadi buat program lebih dulu di halaman Semua program.</p></div></div></section>)}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar tugas</h2><p>{tasks.length} tugas terlihat olehmu</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari tugas..." aria-label="Cari tugas" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Tugas</th><th>Program</th><th>Penerima</th><th>Prioritas</th><th>Tenggat</th><th>Status</th><th>Kontrol</th></tr></thead>
        <tbody>
          {rows.map(task => <tr key={task.id}>
            <td><strong>{task.title}</strong></td>
            <td>{task.programName}</td>
            <td>{task.assigneeName}</td>
            <td>{task.priorityLabel}</td>
            <td>{task.overdue ? <em className="review">{task.dueLabel} · terlambat</em> : task.dueLabel}</td>
            <td><em className={task.status === "done" ? "complete" : "review"}>{task.statusLabel}</em></td>
            <td><div className="account-actions">
              {(canAssign || task.assigneeId === currentUserId) && <button type="button" onClick={() => setSelected({ task, action: "edit" })} title="Ubah" aria-label={`Ubah tugas ${task.title}`}><PencilSimple size={16} /></button>}
              {canAssign && <button className="delete-account" type="button" onClick={() => setSelected({ task, action: "delete" })} title="Hapus" aria-label={`Hapus tugas ${task.title}`}><Trash size={16} /></button>}
            </div></td>
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={7}><div className="empty-state"><span><CheckCircle size={21} /></span><div><strong>{query ? "Tugas tidak ditemukan" : "Belum ada tugas"}</strong><p>{query ? "Coba kata kunci lain." : "Tugas yang selesai menghitung progress programnya."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <TaskDialog task={selected.task} action={selected.action} programs={programs} members={members} canAssign={canAssign} onClose={() => setSelected(null)} />}
  </div>;
}

function TaskFields({ programs, members, action, state, submitLabel, task, canAssign, icon }: {
  programs: Option[]; members: Option[]; action: (form: FormData) => void;
  state: { message?: string; error?: string }; submitLabel: string; task?: TaskRow; canAssign: boolean; icon?: boolean;
}) {
  return <form action={action}>
    {task && <input type="hidden" name="task_id" value={task.id} />}
    <label>Judul tugas<input name="title" defaultValue={task?.title} required minLength={3} maxLength={140} placeholder="Susun daftar peserta" /></label>
    <label>Program<select name="program_id" defaultValue={task?.programId || ""} required><option value="" disabled>Pilih program</option>{programs.map(program => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label>
    <label>Penerima<select name="assignee_id" defaultValue={task?.assigneeId || ""} disabled={!canAssign}><option value="">Belum ditugaskan</option>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
    <label>Prioritas<select name="priority" defaultValue={task?.priority || "medium"}>{priorities.map(priority => <option value={priority} key={priority}>{priorityLabel(priority)}</option>)}</select></label>
    <label>Status<select name="status" defaultValue={task?.status || "todo"}>{taskStatuses.map(status => <option value={status} key={status}>{taskStatusLabel(status)}</option>)}</select></label>
    <label>Tanggal mulai<input name="starts_on" type="date" defaultValue={task?.startsOn} /></label>
    <label>Tenggat<input name="due_on" type="date" defaultValue={task?.dueOn} /></label>
    <label>Catatan<input name="description" defaultValue={task?.description} maxLength={300} /></label>
    <div className="account-submit"><button className="primary-button" type="submit">{icon && <Plus size={17} />}{submitLabel}</button></div>
    {state.message && <p className="inline-message success">{state.message}</p>}
    {state.error && <p className="inline-message error">{state.error}</p>}
  </form>;
}

function TaskDialog({ task, action, programs, members, canAssign, onClose }: { task: TaskRow; action: Dialog["action"]; programs: Option[]; members: Option[]; canAssign: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updateTask : deleteTask, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="task-dialog-title">{action === "edit" ? "Ubah tugas" : "Hapus tugas"}</h2>
      <p>{action === "edit" ? (canAssign ? `Perbarui ${task.title}.` : `Kamu dapat memperbarui ${task.title} karena tugas ini ditugaskan kepadamu.`) : `Tugas ${task.title} dihapus permanen dan progress programnya ikut dihitung ulang.`}</p>
      {action === "edit" ? <TaskFields programs={programs} members={members} action={formAction} state={state} submitLabel="Simpan perubahan" task={task} canAssign={canAssign} /> : <form action={formAction}>
        <input type="hidden" name="task_id" value={task.id} />
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus tugas</button>
      </form>}
    </section>
  </div>;
}
