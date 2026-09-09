"use client";

import { Gear, ShieldCheck, UserMinus } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { assignUserRole, removeUserRole, setRolePermission } from "@/app/settings/actions";
import type { MemberRoleRow, PermissionItem, RoleRow } from "@/backend/settings-data";

export function SettingsView({ roles, permissions, members, periodName, withoutRoleCount, rootHolderCount }: {
  roles: RoleRow[]; permissions: PermissionItem[]; members: MemberRoleRow[]; periodName: string;
  withoutRoleCount: number; rootHolderCount: number;
}) {
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id || "");
  const [assignState, assignAction] = useActionState(assignUserRole, {});
  const activeRole = roles.find(role => role.id === activeRoleId) || roles[0];
  const grouped = useMemo(() => {
    const groups = new Map<string, PermissionItem[]>();
    for (const permission of permissions) groups.set(permission.group, [...(groups.get(permission.group) || []), permission]);
    return [...groups.entries()];
  }, [permissions]);

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Pengaturan</h1><span>Konfigurasi akses, role, dan permission organisasi.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><Gear size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Role pengguna berlaku per periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Pengaturan</h1><span>Konfigurasi akses, role, dan permission organisasi.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan pengaturan">
      <article><span>Role</span><strong>{roles.length}</strong><small>Dapat dikonfigurasi</small></article>
      <article><span>Permission</span><strong>{permissions.length}</strong><small>Akses tindakan</small></article>
      <article><span>Tanpa role</span><strong>{withoutRoleCount}</strong><small>Anggota aktif periode {periodName}</small></article>
    </section>

    {rootHolderCount <= 1 && <section className="panel module-table-panel">
      <div className="empty-state"><span><ShieldCheck size={21} /></span><div><strong>Hanya satu pengelola sistem</strong><p>Jika akun ini hilang, tidak ada yang dapat mengatur role lagi dari dalam aplikasi. Tetapkan setidaknya satu pengelola cadangan.</p></div></div>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Role dan permission</h2><p>Centang izin yang dimiliki role terpilih. Perubahan langsung tersimpan.</p></div>
        <label className="table-search"><select value={activeRoleId} onChange={event => setActiveRoleId(event.target.value)} aria-label="Pilih role">{roles.map(role => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
      </div>
      {activeRole && <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Kelompok</th><th>Permission</th><th>Keterangan</th><th>Aktif</th></tr></thead>
        <tbody>
          {grouped.map(([group, items]) => items.map((permission, index) => {
            const enabled = activeRole.permissionIds.includes(permission.id);
            return <tr key={permission.id}>
              <td>{index === 0 ? <strong>{group}</strong> : ""}</td>
              <td>{permission.key}</td>
              <td>{permission.description || "-"}</td>
              <td><form action={setRolePermission}>
                <input type="hidden" name="role_id" value={activeRole.id} />
                <input type="hidden" name="permission_id" value={permission.id} />
                <input type="hidden" name="enable" value={enabled ? "false" : "true"} />
                <button className={enabled ? "" : "delete-account"} title={enabled ? "Cabut izin" : "Beri izin"} aria-label={`${enabled ? "Cabut" : "Beri"} ${permission.key} untuk ${activeRole.name}`}>
                  <em className={enabled ? "complete" : "review"}>{enabled ? "Aktif" : "Nonaktif"}</em>
                </button>
              </form></td>
            </tr>;
          }))}
        </tbody>
      </table></div>}
    </section>

    <section className="panel account-create">
      <div className="panel-heading"><div><h2>Role pengguna</h2><p>Role berlaku pada periode {periodName}.</p></div></div>
      <form action={assignAction}>
        <label>Anggota<select name="user_id" defaultValue="" required disabled={!members.length}><option value="" disabled>{members.length ? "Pilih anggota" : "Belum ada anggota aktif"}</option>{members.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label>Role<select name="role_id" defaultValue="" required><option value="" disabled>Pilih role</option>{roles.map(role => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
        <div className="account-submit"><button className="primary-button" type="submit">Tetapkan role</button></div>
        {assignState.message && <p className="inline-message success">{assignState.message}</p>}
        {assignState.error && <p className="inline-message error">{assignState.error}</p>}
      </form>
    </section>

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Role tiap anggota</h2><p>{members.length} anggota aktif</p></div></div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Anggota</th><th>Role</th><th>Kontrol</th></tr></thead>
        <tbody>
          {members.map(member => <tr key={member.id}>
            <td><strong>{member.name}</strong></td>
            <td>{member.roleLabel}</td>
            <td><div className="account-actions">{member.roleIds.map(roleId => <form action={removeUserRole} key={roleId}>
              <input type="hidden" name="user_id" value={member.id} />
              <input type="hidden" name="role_id" value={roleId} />
              <button title={`Cabut ${roles.find(role => role.id === roleId)?.name}`} aria-label={`Cabut role ${roles.find(role => role.id === roleId)?.name} dari ${member.name}`}><UserMinus size={16} /></button>
            </form>)}{!member.roleIds.length && <span className="account-self">Tanpa role</span>}</div></td>
          </tr>)}
          {!members.length && <tr><td className="empty-table" colSpan={3}>Belum ada anggota aktif.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </div>;
}
