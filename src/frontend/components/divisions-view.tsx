"use client";

import { MagnifyingGlass, PencilSimple, Plus, Trash, UserMinus, UsersThree, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { addDivisionMember, createDivision, deleteDivision, removeDivisionMember, updateDivision } from "@/app/divisions/actions";
import type { DivisionMember, DivisionRow } from "@/backend/divisions-data";

type Dialog = { division: DivisionRow; action: "edit" | "delete" | "members" };

export function DivisionsView({ divisions, candidates, periodName, memberCount, unassignedCount, canManage }: {
  divisions: DivisionRow[]; candidates: DivisionMember[]; periodName: string;
  memberCount: number; unassignedCount: number; canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [createState, createAction] = useActionState(createDivision, {});
  const rows = useMemo(() => divisions.filter(division => `${division.name} ${division.coordinatorName} ${division.description}`.toLowerCase().includes(query.toLowerCase())), [divisions, query]);

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Divisi</h1><span>Pantau koordinator, anggota, dan program setiap divisi.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><UsersThree size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Divisi selalu menempel pada satu periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Divisi</h1><span>Pantau koordinator, anggota, dan program setiap divisi.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan divisi">
      <article><span>Divisi aktif</span><strong>{divisions.length}</strong><small>Periode {periodName}</small></article>
      <article><span>Anggota terbagi</span><strong>{memberCount}</strong><small>Punya divisi</small></article>
      <article><span>Belum berdivisi</span><strong>{unassignedCount}</strong><small>Anggota aktif</small></article>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Tambah divisi</h2><p>Divisi dibuat pada periode {periodName}.</p></div></div>
      <form action={createAction}>
        <label>Nama divisi<input name="name" placeholder="Community Development" required minLength={3} maxLength={60} /></label>
        <label>Koordinator<select name="coordinator_id" defaultValue=""><option value="">Belum ditetapkan</option>{candidates.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label>
        <label>Deskripsi<input name="description" maxLength={300} placeholder="Fokus kerja divisi" /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><Plus size={17} />Tambah divisi</button></div>
        {createState.message && <p className="inline-message success">{createState.message}</p>}
        {createState.error && <p className="inline-message error">{createState.error}</p>}
      </form>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar divisi</h2><p>{divisions.length} divisi pada periode {periodName}</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari divisi..." aria-label="Cari divisi" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Nama divisi</th><th>Koordinator</th><th>Anggota</th><th>Program</th><th>Deskripsi</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(division => <tr key={division.id}>
            <td><strong>{division.name}</strong></td>
            <td>{division.coordinatorName}</td>
            <td>{division.members.length} anggota</td>
            <td>{division.programCount} program</td>
            <td>{division.description || "-"}</td>
            {canManage && <td><div className="account-actions">
              <button type="button" onClick={() => setSelected({ division, action: "members" })} title="Kelola anggota" aria-label={`Kelola anggota divisi ${division.name}`}><UsersThree size={16} /></button>
              <button type="button" onClick={() => setSelected({ division, action: "edit" })} title="Ubah" aria-label={`Ubah divisi ${division.name}`}><PencilSimple size={16} /></button>
              <button className="delete-account" type="button" onClick={() => setSelected({ division, action: "delete" })} title="Hapus" aria-label={`Hapus divisi ${division.name}`}><Trash size={16} /></button>
            </div></td>}
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={canManage ? 6 : 5}><div className="empty-state"><span><UsersThree size={21} /></span><div><strong>{query ? "Divisi tidak ditemukan" : "Belum ada divisi"}</strong><p>{query ? "Coba kata kunci lain." : `Tambahkan divisi pertama untuk periode ${periodName}.`}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <DivisionDialog division={selected.division} action={selected.action} candidates={candidates} onClose={() => setSelected(null)} />}
  </div>;
}

function DivisionDialog({ division, action, candidates, onClose }: { division: DivisionRow; action: Dialog["action"]; candidates: DivisionMember[]; onClose: () => void }) {
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="division-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      {action === "members" ? <DivisionMembers division={division} candidates={candidates} /> : <DivisionForm division={division} action={action} candidates={candidates} />}
    </section>
  </div>;
}

function DivisionForm({ division, action, candidates }: { division: DivisionRow; action: "edit" | "delete"; candidates: DivisionMember[] }) {
  const [state, formAction] = useActionState(action === "edit" ? updateDivision : deleteDivision, {});
  return <>
    <h2 id="division-dialog-title">{action === "edit" ? "Ubah divisi" : "Hapus divisi"}</h2>
    <p>{action === "edit" ? `Perbarui data divisi ${division.name}.` : `${division.members.length} anggota akan kehilangan divisi. Program yang terkait tetap ada tanpa divisi.`}</p>
    <form action={formAction}>
      <input type="hidden" name="division_id" value={division.id} />
      {action === "edit" ? <>
        <label>Nama divisi<input name="name" defaultValue={division.name} autoFocus required minLength={3} maxLength={60} /></label>
        <label>Koordinator<select name="coordinator_id" defaultValue={division.coordinatorId}><option value="">Belum ditetapkan</option>{candidates.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label>
        <label>Deskripsi<input name="description" defaultValue={division.description} maxLength={300} /></label>
      </> : <label>Ketik HAPUS untuk melanjutkan<input name="confirmation" autoFocus required /></label>}
      {state.error && <p className="inline-message error">{state.error}</p>}
      {state.message && <p className="inline-message success">{state.message}</p>}
      <button className={action === "delete" ? "danger-button" : "primary-button"}>{action === "edit" ? "Simpan perubahan" : "Hapus divisi"}</button>
    </form>
  </>;
}

function DivisionMembers({ division, candidates }: { division: DivisionRow; candidates: DivisionMember[] }) {
  const [state, formAction] = useActionState(addDivisionMember, {});
  const memberIds = new Set(division.members.map(member => member.id));
  const available = candidates.filter(candidate => !memberIds.has(candidate.id));
  return <>
    <h2 id="division-dialog-title">Anggota {division.name}</h2>
    <p>Satu anggota hanya menempati satu divisi pada periode aktif. Menambahkan anggota di sini akan memindahkannya dari divisi sebelumnya.</p>
    <form action={formAction}>
      <input type="hidden" name="division_id" value={division.id} />
      <label>Tambahkan anggota<select name="member_id" defaultValue="" disabled={!available.length} required>
        <option value="" disabled>{available.length ? "Pilih anggota" : "Semua anggota aktif sudah masuk divisi ini"}</option>
        {available.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}
      </select></label>
      {state.error && <p className="inline-message error">{state.error}</p>}
      {state.message && <p className="inline-message success">{state.message}</p>}
      <button className="primary-button" disabled={!available.length}>Tambahkan</button>
    </form>
    <div className="document-table-wrap"><table className="document-table accounts-table">
      <tbody>
        {division.members.map(member => <tr key={member.id}>
          <td><strong>{member.name}</strong></td>
          <td><div className="account-actions"><form action={removeDivisionMember}><input type="hidden" name="division_id" value={division.id} /><input type="hidden" name="member_id" value={member.id} /><button title="Lepas dari divisi" aria-label={`Lepas ${member.name} dari divisi`}><UserMinus size={16} /></button></form></div></td>
        </tr>)}
        {!division.members.length && <tr><td className="empty-table" colSpan={2}>Belum ada anggota pada divisi ini.</td></tr>}
      </tbody>
    </table></div>
  </>;
}
