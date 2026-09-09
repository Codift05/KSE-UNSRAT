"use client";

import { MagnifyingGlass, PencilSimple, UserPlus, UsersThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { setMemberDivision, updateMember } from "@/app/members/actions";
import { Pagination } from "@/frontend/components/module-view";
import { memberStatuses } from "@/backend/member-profile";
import { memberStatusLabel } from "@/backend/attendance-status";
import type { DivisionOption, MemberRow } from "@/backend/members-data";

type Dialog = { member: MemberRow; action: "edit" | "division" };

export function MembersView({ members, divisions, periodName, activeCount, alumniCount, unassignedCount, canManage }: {
  members: MemberRow[]; divisions: DivisionOption[]; periodName: string;
  activeCount: number; alumniCount: number; unassignedCount: number; canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Dialog | null>(null);
  const filtered = useMemo(() => members.filter(member => `${member.name} ${member.email} ${member.studyProgram} ${member.divisionLabel}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return <div className="content accounts-page">
    <section className="page-heading">
      <div><h1>Anggota</h1><span>Kelola data dan status seluruh anggota KSE Unsrat.</span></div>
      {canManage && <Link className="primary-button standalone" href="/accounts"><UserPlus size={18} weight="bold" />Tambah anggota</Link>}
    </section>

    <section className="module-stats" aria-label="Ringkasan anggota">
      <article><span>Anggota aktif</span><strong>{activeCount}</strong><small>{periodName ? `Periode ${periodName}` : "Belum ada periode aktif"}</small></article>
      <article><span>Alumni</span><strong>{alumniCount}</strong><small>Semua periode</small></article>
      <article><span>Belum berdivisi</span><strong>{unassignedCount}</strong><small>Anggota aktif tanpa divisi</small></article>
    </section>

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar anggota</h2><p>{members.length} anggota terhubung ke akun Supabase</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari anggota..." aria-label="Cari anggota" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Nama</th><th>Email</th><th>Program studi</th><th>Angkatan</th><th>Divisi</th><th>Status</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(member => <tr key={member.id}>
            <td><strong>{member.name}</strong></td>
            <td>{member.email}</td>
            <td>{member.studyProgram || "-"}</td>
            <td>{member.cohortYear || "-"}</td>
            <td>{member.divisionLabel}</td>
            <td><em className={member.status === "active" ? "complete" : "review"}>{member.statusLabel}</em></td>
            {canManage && <td><div className="account-actions">
              <button type="button" onClick={() => setSelected({ member, action: "edit" })} title="Ubah data" aria-label={`Ubah data ${member.name}`}><PencilSimple size={16} /></button>
              <button type="button" onClick={() => setSelected({ member, action: "division" })} title="Atur divisi" aria-label={`Atur divisi ${member.name}`}><UsersThree size={16} /></button>
            </div></td>}
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={canManage ? 7 : 6}><div className="empty-state"><span><UsersThree size={21} /></span><div><strong>{query ? "Anggota tidak ditemukan" : "Belum ada anggota"}</strong><p>{query ? "Coba kata kunci lain." : "Anggota muncul otomatis setelah akunnya dibuat di halaman Akun."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
      {filtered.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPage={setPage} />}
    </section>

    {selected && <MemberDialog member={selected.member} action={selected.action} divisions={divisions} periodName={periodName} onClose={() => setSelected(null)} />}
  </div>;
}

function MemberDialog({ member, action, divisions, periodName, onClose }: { member: MemberRow; action: Dialog["action"]; divisions: DivisionOption[]; periodName: string; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updateMember : setMemberDivision, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="member-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="member-dialog-title">{action === "edit" ? "Ubah data anggota" : "Atur divisi"}</h2>
      <p>{action === "edit" ? `Perbarui data ${member.name}. Email login diubah dari halaman Akun.` : periodName ? `Divisi berlaku untuk periode ${periodName}. Penugasan periode lama tetap tersimpan.` : "Belum ada periode aktif. Aktifkan periode lebih dulu di halaman Periode."}</p>
      <form action={formAction}>
        <input type="hidden" name="member_id" value={member.id} />
        {action === "edit" ? <>
          <label>Nama lengkap<input name="full_name" defaultValue={member.name} autoFocus required minLength={2} maxLength={100} /></label>
          <label>Nomor telepon<input name="phone" defaultValue={member.phone} maxLength={30} /></label>
          <label>Fakultas<input name="faculty" defaultValue={member.faculty} maxLength={120} /></label>
          <label>Program studi<input name="study_program" defaultValue={member.studyProgram} maxLength={120} /></label>
          <label>Angkatan<input name="cohort_year" defaultValue={member.cohortYear} inputMode="numeric" pattern="\d{4}" placeholder="2022" /></label>
          <label>Tahun masuk KSE<input name="kse_entry_year" defaultValue={member.kseEntryYear} inputMode="numeric" pattern="\d{4}" placeholder="2023" /></label>
          <label>Status anggota<select name="member_status" defaultValue={member.status}>{memberStatuses.map(status => <option value={status} key={status}>{memberStatusLabel(status)}</option>)}</select></label>
        </> : <label>Divisi periode aktif<select name="division_id" defaultValue={member.divisionIds[0] || ""} disabled={!divisions.length}>
          <option value="">Belum ditetapkan</option>
          {divisions.map(division => <option value={division.id} key={division.id}>{division.name}</option>)}
        </select></label>}
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="primary-button" disabled={action === "division" && !divisions.length}>{action === "edit" ? "Simpan perubahan" : "Simpan divisi"}</button>
      </form>
    </section>
  </div>;
}
