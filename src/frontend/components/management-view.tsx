"use client";

import { PencilSimple, Plus, SquaresFour, Trash, UserMinus, X } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { assignOfficer, createPosition, deletePosition, removeOfficer, updatePosition } from "@/app/management/actions";
import type { ManagementRow, Option, PositionRow } from "@/backend/management-data";

export function ManagementView({ periodName, positions, management, candidates, divisions, officerCount, vacantCount, canManage }: {
  periodName: string; positions: PositionRow[]; management: ManagementRow[]; candidates: Option[]; divisions: Option[];
  officerCount: number; vacantCount: number; canManage: boolean;
}) {
  const [selected, setSelected] = useState<{ position: PositionRow; action: "edit" | "delete" } | null>(null);
  const [assignState, assignAction] = useActionState(assignOfficer, {});
  const [positionState, positionAction] = useActionState(createPosition, {});

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Kepengurusan</h1><span>Struktur pengurus pada periode yang sedang aktif.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><SquaresFour size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Kepengurusan selalu menempel pada satu periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Kepengurusan</h1><span>Struktur pengurus pada periode yang sedang aktif.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan kepengurusan">
      <article><span>Pengurus</span><strong>{officerCount}</strong><small>Periode {periodName}</small></article>
      <article><span>Jabatan</span><strong>{positions.length}</strong><small>Dapat dikonfigurasi</small></article>
      <article><span>Belum terisi</span><strong>{vacantCount}</strong><small>Jabatan kosong</small></article>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Tetapkan pengurus</h2><p>Divisi boleh dikosongkan untuk jabatan inti.</p></div></div>
      <form action={assignAction}>
        <label>Anggota<select name="user_id" defaultValue="" required disabled={!candidates.length}><option value="" disabled>{candidates.length ? "Pilih anggota" : "Belum ada anggota aktif"}</option>{candidates.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label>
        <label>Jabatan<select name="position_id" defaultValue="" required disabled={!positions.length}><option value="" disabled>{positions.length ? "Pilih jabatan" : "Tambahkan jabatan lebih dulu"}</option>{positions.map(position => <option value={position.id} key={position.id}>{position.name}</option>)}</select></label>
        <label>Divisi<select name="division_id" defaultValue=""><option value="">Inti (tanpa divisi)</option>{divisions.map(division => <option value={division.id} key={division.id}>{division.name}</option>)}</select></label>
        <div className="account-submit"><button className="primary-button" type="submit" disabled={!candidates.length || !positions.length}><Plus size={17} />Tetapkan</button></div>
        {assignState.message && <p className="inline-message success">{assignState.message}</p>}
        {assignState.error && <p className="inline-message error">{assignState.error}</p>}
      </form>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Struktur pengurus</h2><p>{management.length} penugasan pada periode {periodName}</p></div></div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Nama</th><th>Jabatan</th><th>Divisi</th><th>Periode</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {management.map(row => <tr key={`${row.userId}-${row.positionId}`}>
            <td><strong>{row.name}</strong></td>
            <td>{row.positionName}</td>
            <td>{row.divisionName}</td>
            <td>{periodName}</td>
            {canManage && <td><div className="account-actions"><form action={removeOfficer}><input type="hidden" name="user_id" value={row.userId} /><input type="hidden" name="position_id" value={row.positionId} /><button title="Lepas dari jabatan" aria-label={`Lepas ${row.name} dari ${row.positionName}`}><UserMinus size={16} /></button></form></div></td>}
          </tr>)}
          {!management.length && <tr><td className="empty-table" colSpan={canManage ? 5 : 4}><div className="empty-state"><span><SquaresFour size={21} /></span><div><strong>Belum ada pengurus</strong><p>Tambahkan jabatan lebih dulu, lalu tetapkan anggota ke jabatan itu.</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Jabatan</h2><p>Urutan menentukan posisi pada struktur; angka kecil tampil lebih dulu.</p></div></div>
      <form action={positionAction}>
        <label>Nama jabatan<input name="name" placeholder="Ketua" required minLength={3} maxLength={60} /></label>
        <label>Urutan<input name="sort_order" inputMode="numeric" pattern="\d{1,3}" placeholder="0" /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><Plus size={17} />Tambah jabatan</button></div>
        {positionState.message && <p className="inline-message success">{positionState.message}</p>}
        {positionState.error && <p className="inline-message error">{positionState.error}</p>}
      </form>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Daftar jabatan</h2><p>{positions.length} jabatan pada periode {periodName}</p></div></div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Jabatan</th><th>Urutan</th><th>Dipegang</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {positions.map(position => <tr key={position.id}>
            <td><strong>{position.name}</strong></td>
            <td>{position.sortOrder}</td>
            <td><em className={position.holderCount ? "complete" : "review"}>{position.holderCount ? `${position.holderCount} pengurus` : "Belum terisi"}</em></td>
            {canManage && <td><div className="account-actions">
              <button type="button" onClick={() => setSelected({ position, action: "edit" })} title="Ubah" aria-label={`Ubah jabatan ${position.name}`}><PencilSimple size={16} /></button>
              <button className="delete-account" type="button" onClick={() => setSelected({ position, action: "delete" })} title="Hapus" aria-label={`Hapus jabatan ${position.name}`}><Trash size={16} /></button>
            </div></td>}
          </tr>)}
          {!positions.length && <tr><td className="empty-table" colSpan={canManage ? 4 : 3}>Belum ada jabatan pada periode ini.</td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <PositionDialog position={selected.position} action={selected.action} onClose={() => setSelected(null)} />}
  </div>;
}

function PositionDialog({ position, action, onClose }: { position: PositionRow; action: "edit" | "delete"; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updatePosition : deletePosition, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="position-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="position-dialog-title">{action === "edit" ? "Ubah jabatan" : "Hapus jabatan"}</h2>
      <p>{action === "edit" ? `Perbarui nama dan urutan ${position.name}.` : position.holderCount ? `${position.holderCount} pengurus akan kehilangan jabatan ini.` : `Jabatan ${position.name} belum dipegang siapa pun.`}</p>
      <form action={formAction}>
        <input type="hidden" name="position_id" value={position.id} />
        {action === "edit" ? <>
          <label>Nama jabatan<input name="name" defaultValue={position.name} autoFocus required minLength={3} maxLength={60} /></label>
          <label>Urutan<input name="sort_order" defaultValue={String(position.sortOrder)} inputMode="numeric" pattern="\d{1,3}" /></label>
        </> : position.holderCount ? <label>Ketik HAPUS untuk melanjutkan<input name="confirmation" autoFocus required /></label> : null}
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className={action === "delete" ? "danger-button" : "primary-button"}>{action === "edit" ? "Simpan perubahan" : "Hapus jabatan"}</button>
      </form>
    </section>
  </div>;
}
