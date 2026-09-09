"use client";

import { Cube, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { cancelLoan, createItem, deleteItem, requestLoan, setLoanStatus, updateItem } from "@/app/inventory/actions";
import { conditionLabel, itemConditions, itemStatusLabel, itemStatuses } from "@/backend/inventory-input";
import type { ItemRow, LoanRow, Option } from "@/backend/inventory-data";

type Dialog = { item: ItemRow; action: "edit" | "delete" };

export function InventoryView({ items, loans, programs, scopeLabel, totalItems, borrowedCount, overdueCount, waitingCount, canManage, canApprove }: {
  items: ItemRow[]; loans: LoanRow[]; programs: Option[]; scopeLabel: string;
  totalItems: number; borrowedCount: number; overdueCount: number; waitingCount: number;
  canManage: boolean; canApprove: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dialog | null>(null);
  const [itemState, itemAction] = useActionState(createItem, {});
  const [loanState, loanAction] = useActionState(requestLoan, {});
  const rows = useMemo(() => items.filter(item => `${item.code} ${item.name} ${item.location} ${item.statusLabel}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const available = items.filter(item => item.availableQuantity > 0);

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Inventaris</h1><span>Kelola ketersediaan, kondisi, dan peminjaman aset.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan inventaris">
      <article><span>Total unit</span><strong>{totalItems}</strong><small>{items.length} jenis barang</small></article>
      <article><span>Sedang dipinjam</span><strong>{borrowedCount}</strong><small>{scopeLabel}</small></article>
      <article><span>Terlambat</span><strong>{overdueCount}</strong><small>Lewat rencana kembali</small></article>
    </section>

    <section className="panel account-create">
      <div className="panel-heading"><div><h2>Ajukan peminjaman</h2><p>Pengajuan menunggu persetujuan pengurus sebelum barang keluar.</p></div></div>
      <form action={loanAction}>
        <label>Barang<select name="item_id" defaultValue="" required disabled={!available.length}><option value="" disabled>{available.length ? "Pilih barang" : "Tidak ada barang tersedia"}</option>{available.map(item => <option value={item.id} key={item.id}>{item.name} · tersedia {item.availableQuantity}</option>)}</select></label>
        <label>Jumlah<input name="quantity" inputMode="numeric" defaultValue="1" required /></label>
        <label>Tanggal pinjam<input name="borrowed_on" type="date" required /></label>
        <label>Rencana kembali<input name="expected_return_on" type="date" required /></label>
        <label>Program<select name="program_id" defaultValue=""><option value="">Organisasi</option>{programs.map(program => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label>
        <label>Keperluan<input name="purpose" required maxLength={200} placeholder="Dokumentasi kegiatan" /></label>
        <div className="account-submit"><button className="primary-button" type="submit" disabled={!available.length}><Plus size={17} />Ajukan</button></div>
        {loanState.message && <p className="inline-message success">{loanState.message}</p>}
        {loanState.error && <p className="inline-message error">{loanState.error}</p>}
      </form>
    </section>

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Peminjaman</h2><p>{scopeLabel} · {waitingCount} menunggu persetujuan</p></div></div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Barang</th><th>Peminjam</th><th>Jumlah</th><th>Pinjam</th><th>Rencana kembali</th><th>Program</th><th>Status</th><th>Kontrol</th></tr></thead>
        <tbody>
          {loans.map(loan => <tr key={loan.id}>
            <td><strong>{loan.itemName}</strong></td>
            <td>{loan.borrowerName}{loan.mine ? " · kamu" : ""}</td>
            <td>{loan.quantity}</td>
            <td>{loan.borrowedLabel}</td>
            <td>{loan.overdue ? <em className="review">{loan.expectedLabel} · terlambat</em> : loan.expectedLabel}</td>
            <td>{loan.programName}</td>
            <td><em className={["completed", "returned"].includes(loan.status) ? "complete" : "review"}>{loan.statusLabel}</em></td>
            <td><div className="account-actions">
              {canApprove && loan.status === "waiting_approval" && <>
                <StatusButton loanId={loan.id} status="approved" label="Setujui" />
                <StatusButton loanId={loan.id} status="rejected" label="Tolak" danger />
              </>}
              {canApprove && loan.status === "approved" && <StatusButton loanId={loan.id} status="borrowed" label="Serahkan" />}
              {canApprove && loan.status === "borrowed" && <StatusButton loanId={loan.id} status="returned" label="Terima kembali" />}
              {canApprove && loan.status === "returned" && <StatusButton loanId={loan.id} status="completed" label="Selesaikan" />}
              {loan.status === "waiting_approval" && (loan.mine || canApprove) && <form action={cancelLoan}><input type="hidden" name="loan_id" value={loan.id} /><button className="delete-account" title="Batalkan pengajuan" aria-label={`Batalkan pengajuan ${loan.itemName}`}><Trash size={16} /></button></form>}
            </div></td>
          </tr>)}
          {!loans.length && <tr><td className="empty-table" colSpan={8}><div className="empty-state"><span><Cube size={21} /></span><div><strong>Belum ada peminjaman</strong><p>Pengajuan yang kamu kirim muncul di sini beserta statusnya.</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Tambah barang</h2><p>Jumlah tersedia berkurang otomatis ketika barang diserahkan.</p></div></div>
      <ItemFields action={itemAction} state={itemState} submitLabel="Tambah barang" icon />
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Daftar barang</h2><p>{items.length} jenis barang tercatat</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari barang..." aria-label="Cari barang" /></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Kode</th><th>Nama barang</th><th>Tersedia</th><th>Kondisi</th><th>Lokasi</th><th>Status</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {rows.map(item => <tr key={item.id}>
            <td><strong>{item.code}</strong></td>
            <td>{item.name}</td>
            <td>{item.availableQuantity} dari {item.quantity}</td>
            <td>{item.conditionLabel}</td>
            <td>{item.location || "-"}</td>
            <td><em className={item.status === "available" ? "complete" : "review"}>{item.statusLabel}</em></td>
            {canManage && <td><div className="account-actions">
              <button type="button" onClick={() => setSelected({ item, action: "edit" })} title="Ubah" aria-label={`Ubah ${item.name}`}><PencilSimple size={16} /></button>
              <button className="delete-account" type="button" onClick={() => setSelected({ item, action: "delete" })} title="Hapus" aria-label={`Hapus ${item.name}`}><Trash size={16} /></button>
            </div></td>}
          </tr>)}
          {!rows.length && <tr><td className="empty-table" colSpan={canManage ? 7 : 6}><div className="empty-state"><span><Cube size={21} /></span><div><strong>{query ? "Barang tidak ditemukan" : "Belum ada barang"}</strong><p>{query ? "Coba kata kunci lain." : "Tambahkan barang pertama untuk mulai mencatat peminjaman."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
    </section>

    {selected && <ItemDialog item={selected.item} action={selected.action} onClose={() => setSelected(null)} />}
  </div>;
}

function StatusButton({ loanId, status, label, danger }: { loanId: string; status: string; label: string; danger?: boolean }) {
  return <form action={setLoanStatus}>
    <input type="hidden" name="loan_id" value={loanId} />
    <input type="hidden" name="status" value={status} />
    <button className={danger ? "delete-account" : ""} title={label} aria-label={label}><em className={danger ? "review" : "complete"}>{label}</em></button>
  </form>;
}

function ItemFields({ action, state, submitLabel, item, icon }: {
  action: (form: FormData) => void; state: { message?: string; error?: string }; submitLabel: string; item?: ItemRow; icon?: boolean;
}) {
  return <form action={action}>
    {item && <input type="hidden" name="item_id" value={item.id} />}
    <label>Kode<input name="code" defaultValue={item?.code} required placeholder="KSE-EL-001" /></label>
    <label>Nama barang<input name="name" defaultValue={item?.name} required minLength={3} maxLength={100} placeholder="Kamera Canon EOS" /></label>
    <label>Jumlah total<input name="quantity" inputMode="numeric" defaultValue={item ? String(item.quantity) : "1"} required /></label>
    <label>Jumlah tersedia<input name="available_quantity" inputMode="numeric" defaultValue={item ? String(item.availableQuantity) : "1"} required /></label>
    <label>Kondisi<select name="condition" defaultValue={item?.condition || "good"}>{itemConditions.map(condition => <option value={condition} key={condition}>{conditionLabel(condition)}</option>)}</select></label>
    <label>Status<select name="status" defaultValue={item?.status || "available"}>{itemStatuses.map(status => <option value={status} key={status}>{itemStatusLabel(status)}</option>)}</select></label>
    <label>Lokasi<input name="location" defaultValue={item?.location} maxLength={120} placeholder="Sekretariat" /></label>
    <label>Catatan<input name="notes" defaultValue={item?.notes} maxLength={300} /></label>
    <div className="account-submit"><button className="primary-button" type="submit">{icon && <Plus size={17} />}{submitLabel}</button></div>
    {state.message && <p className="inline-message success">{state.message}</p>}
    {state.error && <p className="inline-message error">{state.error}</p>}
  </form>;
}

function ItemDialog({ item, action, onClose }: { item: ItemRow; action: Dialog["action"]; onClose: () => void }) {
  const [state, formAction] = useActionState(action === "edit" ? updateItem : deleteItem, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="item-dialog-title">{action === "edit" ? "Ubah barang" : "Hapus barang"}</h2>
      <p>{action === "edit" ? `Perbarui data ${item.name}.` : `Barang dengan riwayat peminjaman tidak dapat dihapus. Tandai rusak atau hilang bila sudah tidak dipakai.`}</p>
      {action === "edit" ? <ItemFields action={formAction} state={state} submitLabel="Simpan perubahan" item={item} /> : <form action={formAction}>
        <input type="hidden" name="item_id" value={item.id} />
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus barang</button>
      </form>}
    </section>
  </div>;
}
