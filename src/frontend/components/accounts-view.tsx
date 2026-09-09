"use client";

import { Key, MagnifyingGlass, Plus, Trash, UserCheck, UserMinus, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { createAccount, deleteAccount, resetAccountPassword, setAccountAccess } from "@/app/accounts/actions";
import type { AccountRow } from "@/backend/accounts-data";

export function AccountsView({ accounts, currentUserId }: { accounts: AccountRow[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ account: AccountRow; action: "reset" | "delete" } | null>(null);
  const [createState, createAction] = useActionState(createAccount, {});
  const rows = useMemo(() => accounts.filter(account => `${account.name} ${account.email}`.toLowerCase().includes(query.toLowerCase())), [accounts, query]);
  return <div className="content accounts-page"><section className="page-heading"><div><h1>Akun beswan</h1><span>Buat dan kelola akses login tanpa membuat data anggota terpisah.</span></div></section>
    <section className="panel account-create"><div className="panel-heading"><div><h2>Buat akun</h2><p>Beswan hanya perlu menerima akun ini lalu login.</p></div></div><form action={createAction}><label>Nama lengkap<input name="full_name" required maxLength={100} /></label><label>Email login<input name="email" type="email" required /></label><label>Password awal<input name="password" type="password" minLength={8} required /></label><div className="account-submit"><button className="primary-button" type="submit"><Plus size={17} />Buat akun</button></div>{createState.message && <p className="inline-message success">{createState.message}</p>}{createState.error && <p className="inline-message error">{createState.error}</p>}</form></section>
    <section className="panel module-table-panel"><div className="panel-heading module-toolbar"><div><h2>Daftar akun</h2><p>{accounts.length} akun terhubung ke Supabase Auth</p></div><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari akun..." aria-label="Cari akun" /></label></div><div className="document-table-wrap"><table className="document-table accounts-table"><thead><tr><th>Beswan</th><th>Email</th><th>Status anggota</th><th>Akses</th><th>Dibuat</th><th>Kontrol</th></tr></thead><tbody>{rows.map(account => <AccountItem account={account} currentUserId={currentUserId} onSelect={(action) => setSelected({ account, action })} key={account.id} />)}{!rows.length && <tr><td className="empty-table" colSpan={6}>Belum ada akun yang sesuai.</td></tr>}</tbody></table></div></section>
    {selected && <AccountDialog account={selected.account} action={selected.action} onClose={() => setSelected(null)} />}
  </div>;
}

function AccountItem({ account, currentUserId, onSelect }: { account: AccountRow; currentUserId: string; onSelect: (action: "reset" | "delete") => void }) {
  const canManage = account.id !== currentUserId;
  return <tr><td><strong>{account.name}</strong></td><td>{account.email}</td><td>{account.memberStatus}</td><td><em className={account.access === "Aktif" ? "complete" : "review"}>{account.access}</em></td><td>{account.createdAt}</td><td><div className="account-actions">
    {canManage ? <><form action={setAccountAccess}><input type="hidden" name="account_id" value={account.id} /><button name="access" value={account.access === "Aktif" ? "disable" : "enable"} title={account.access === "Aktif" ? "Nonaktifkan" : "Aktifkan"} aria-label={account.access === "Aktif" ? "Nonaktifkan akun" : "Aktifkan akun"}>{account.access === "Aktif" ? <UserMinus size={16} /> : <UserCheck size={16} />}</button></form><button className="delete-account" type="button" onClick={() => onSelect("delete")} title="Hapus permanen" aria-label="Hapus akun permanen"><Trash size={16} /></button></> : <span className="account-self">Akun ini</span>}
    <button type="button" onClick={() => onSelect("reset")} title="Reset password" aria-label="Reset password"><Key size={16} /></button>
  </div></td></tr>;
}

function AccountDialog({ account, action, onClose }: { account: AccountRow; action: "reset" | "delete"; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "reset" ? resetAccountPassword : deleteAccount, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" onMouseDown={event => event.stopPropagation()}><button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button><h2 id="account-dialog-title">{action === "reset" ? "Reset password" : "Hapus akun permanen"}</h2><p>{action === "reset" ? `Atur password baru untuk ${account.name}.` : `Profil dan histori ${account.name} akan dihapus permanen.`}</p><form action={formAction}><input type="hidden" name="account_id" value={account.id} />{action === "reset" ? <label>Password baru<input name="password" type="password" minLength={8} autoFocus required /></label> : <label>Ketik HAPUS untuk melanjutkan<input name="confirmation" autoFocus required /></label>}{state.error && <p className="inline-message error">{state.error}</p>}{state.message && <p className="inline-message success">{state.message}</p>}<button className={action === "delete" ? "danger-button" : "primary-button"}>{action === "reset" ? "Simpan password" : "Hapus akun"}</button></form></section></div>;
}
