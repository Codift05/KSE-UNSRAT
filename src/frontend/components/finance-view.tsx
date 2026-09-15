"use client";

import { ArrowSquareOut, CloudSlash, Coins, MagnifyingGlass, Plus, Trash, UsersThree, X } from "@phosphor-icons/react";
import { useActionState, useMemo, useState } from "react";
import { createTransaction, deleteTransaction, recordDues, setDuesTarget } from "@/app/finance/actions";
import { Pagination } from "@/frontend/components/pagination";
import type { DuesRow, Option, TransactionRow } from "@/backend/finance-data";

export function FinanceView({
  transactions, dues, categories, members, periodName, duesTarget,
  saldoLabel, masukBulanIni, keluarBulanIni, totalMasukLabel, totalKeluarLabel,
  belumLunas, tunggakanLabel, canManage, driveConfigured,
}: {
  transactions: TransactionRow[]; dues: DuesRow[]; categories: Option[]; members: Option[];
  periodName: string; duesTarget: number;
  saldoLabel: string; masukBulanIni: string; keluarBulanIni: string;
  totalMasukLabel: string; totalKeluarLabel: string;
  belumLunas: number; tunggakanLabel: string; canManage: boolean; driveConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [arah, setArah] = useState("");
  const [page, setPage] = useState(1);
  const [hapus, setHapus] = useState<TransactionRow | null>(null);
  const [trxState, trxAction] = useActionState(createTransaction, {});
  const [duesState, duesAction] = useActionState(recordDues, {});
  const [targetState, targetAction] = useActionState(setDuesTarget, {});
  const pageSize = 15;

  const baris = useMemo(() => transactions.filter(row =>
    (!arah || row.direction === arah) &&
    `${row.description} ${row.categoryName} ${row.note}`.toLowerCase().includes(query.toLowerCase())
  ), [transactions, query, arah]);
  const totalPages = Math.max(1, Math.ceil(baris.length / pageSize));
  const halaman = baris.slice((page - 1) * pageSize, page * pageSize);

  if (!periodName) {
    return <div className="content accounts-page">
      <section className="page-heading"><div><h1>Keuangan</h1><span>Kas organisasi dan iuran anggota.</span></div></section>
      <section className="panel module-table-panel"><div className="empty-state"><span><Coins size={21} /></span><div><strong>Belum ada periode aktif</strong><p>Keuangan dicatat per periode. Aktifkan periode lebih dulu di halaman Periode.</p></div></div></section>
    </div>;
  }

  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>Keuangan</h1><span>Kas organisasi dan iuran anggota periode {periodName}.</span></div></section>

    <section className="module-stats" aria-label="Ringkasan keuangan">
      <article><span>Saldo kas</span><strong>{saldoLabel}</strong><small>Dihitung dari seluruh transaksi</small></article>
      <article><span>Masuk bulan ini</span><strong>{masukBulanIni}</strong><small>Total periode {totalMasukLabel}</small></article>
      <article><span>Keluar bulan ini</span><strong>{keluarBulanIni}</strong><small>Total periode {totalKeluarLabel}</small></article>
    </section>

    <section className="module-stats" aria-label="Ringkasan iuran">
      <article><span>Belum lunas</span><strong>{belumLunas}</strong><small>dari {dues.length} anggota aktif</small></article>
      <article><span>Total tunggakan</span><strong>{tunggakanLabel}</strong><small>Selisih terhadap target</small></article>
      <article><span>Target per anggota</span><strong>{duesTarget ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(duesTarget) : "Belum diatur"}</strong><small>Periode {periodName}</small></article>
    </section>

    {canManage && !duesTarget && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Atur target iuran</h2><p>Tanpa target, status lunas tiap anggota tidak dapat dihitung.</p></div></div>
      <form action={targetAction}>
        <label>Target per anggota<input name="dues_target" inputMode="numeric" placeholder="240000" required /></label>
        <div className="account-submit"><button className="primary-button" type="submit">Simpan target</button></div>
        {targetState.message && <p className="inline-message success">{targetState.message}</p>}
        {targetState.error && <p className="inline-message error">{targetState.error}</p>}
      </form>
    </section>}

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Catat transaksi</h2><p>Saldo tidak pernah diketik. Ia selalu dihitung ulang dari seluruh transaksi.</p></div></div>
      <form action={trxAction}>
        <label>Arah<select name="direction" defaultValue="out"><option value="out">Kas keluar</option><option value="in">Kas masuk</option></select></label>
        <label>Tanggal<input name="occurred_on" type="date" required /></label>
        <label>Nominal<input name="amount" inputMode="numeric" placeholder="240000" required /></label>
        <label>Kategori<select name="category_id" defaultValue=""><option value="">Tanpa kategori</option>{categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Uraian<input name="description" required minLength={3} maxLength={140} placeholder="Bayar listrik sekretariat" /></label>
        <label>Catatan<input name="note" maxLength={300} /></label>
        <label>Bukti pembayaran<input name="proof" type="file" disabled={!driveConfigured} /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><Plus size={17} />Catat</button></div>
        {trxState.message && <p className="inline-message success">{trxState.message}</p>}
        {trxState.error && <p className="inline-message error">{trxState.error}</p>}
      </form>
    </section>}

    {!driveConfigured && <section className="panel module-table-panel">
      <div className="empty-state"><span><CloudSlash size={21} /></span><div><strong>Bukti pembayaran belum dapat diunggah</strong><p>Google Drive belum terhubung. Transaksi tetap dapat dicatat, buktinya menyusul setelah Drive dipasang.</p></div></div>
    </section>}

    {canManage && <section className="panel account-create">
      <div className="panel-heading"><div><h2>Catat iuran</h2><p>Satu pembayaran boleh mencakup beberapa anggota sekaligus. Tahan Ctrl untuk memilih lebih dari satu.</p></div></div>
      <form action={duesAction}>
        <label>Anggota<select name="member_ids" multiple size={6} required disabled={!members.length}>{members.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Nominal per anggota<input name="amount" inputMode="numeric" defaultValue={duesTarget ? String(duesTarget) : ""} required /></label>
        <label>Tanggal bayar<input name="paid_on" type="date" required /></label>
        <label>Catatan<input name="note" maxLength={300} /></label>
        <div className="account-submit"><button className="primary-button" type="submit"><UsersThree size={17} />Catat iuran</button></div>
        {duesState.message && <p className="inline-message success">{duesState.message}</p>}
        {duesState.error && <p className="inline-message error">{duesState.error}</p>}
      </form>
    </section>}

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar">
        <div><h2>Buku kas</h2><p>{transactions.length} transaksi pada periode {periodName}</p></div>
        <label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari transaksi..." aria-label="Cari transaksi" /></label>
      </div>
      <div className="panel-heading module-toolbar">
        <label className="table-search"><select value={arah} onChange={event => { setArah(event.target.value); setPage(1); }} aria-label="Saring arah transaksi">
          <option value="">Semua arah</option><option value="in">Kas masuk</option><option value="out">Kas keluar</option>
        </select></label>
      </div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Tanggal</th><th>Uraian</th><th>Kategori</th><th>Arah</th><th>Nominal</th><th>Dicatat oleh</th><th>Bukti</th>{canManage && <th>Kontrol</th>}</tr></thead>
        <tbody>
          {halaman.map(row => <tr key={row.id}>
            <td>{row.dateLabel}</td>
            <td><strong>{row.description}</strong></td>
            <td>{row.categoryName}</td>
            <td><em className={row.direction === "in" ? "complete" : "review"}>{row.directionLabel}</em></td>
            <td>{row.amountLabel}</td>
            <td>{row.recordedBy}</td>
            <td>{row.proofLink ? <a href={row.proofLink} target="_blank" rel="noopener noreferrer" aria-label={`Buka bukti ${row.description}`}><ArrowSquareOut size={16} /></a> : "-"}</td>
            {canManage && <td><div className="account-actions"><button className="delete-account" type="button" onClick={() => setHapus(row)} title="Hapus" aria-label={`Hapus ${row.description}`}><Trash size={16} /></button></div></td>}
          </tr>)}
          {!halaman.length && <tr><td className="empty-table" colSpan={canManage ? 8 : 7}><div className="empty-state"><span><Coins size={21} /></span><div><strong>{query || arah ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</strong><p>{query || arah ? "Ubah pencarian atau saringan." : "Catat transaksi pertama lewat formulir di atas."}</p></div></div></td></tr>}
        </tbody>
      </table></div>
      {baris.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={baris.length} pageSize={pageSize} onPage={setPage} />}
    </section>

    <section className="panel module-table-panel">
      <div className="panel-heading module-toolbar"><div><h2>Iuran per anggota</h2><p>{belumLunas} dari {dues.length} anggota belum lunas</p></div></div>
      <div className="document-table-wrap"><table className="document-table accounts-table">
        <thead><tr><th>Anggota</th><th>Sudah dibayar</th><th>Kurang</th><th>Terakhir bayar</th><th>Status</th></tr></thead>
        <tbody>
          {dues.map(row => <tr key={row.memberId}>
            <td><strong>{row.name}</strong></td>
            <td>{row.paidLabel}</td>
            <td>{row.outstandingLabel}</td>
            <td>{row.lastPaidLabel}</td>
            <td><em className={row.settled ? "complete" : "review"}>{row.status}</em></td>
          </tr>)}
          {!dues.length && <tr><td className="empty-table" colSpan={5}>Belum ada anggota aktif pada periode ini.</td></tr>}
        </tbody>
      </table></div>
    </section>

    {hapus && <HapusDialog transaction={hapus} onClose={() => setHapus(null)} />}
  </div>;
}

function HapusDialog({ transaction, onClose }: { transaction: TransactionRow; onClose: () => void }) {
  const [state, formAction] = useActionState(deleteTransaction, {});
  return <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="finance-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <h2 id="finance-dialog-title">Hapus transaksi</h2>
      <p>{transaction.description} sebesar {transaction.amountLabel} akan dihapus, dan saldo dihitung ulang tanpanya.</p>
      <form action={formAction}>
        <input type="hidden" name="transaction_id" value={transaction.id} />
        <label>Ketik HAPUS bila transaksi ini tertaut iuran<input name="confirmation" placeholder="HAPUS" /></label>
        {state.error && <p className="inline-message error">{state.error}</p>}
        {state.message && <p className="inline-message success">{state.message}</p>}
        <button className="danger-button">Hapus transaksi</button>
      </form>
    </section>
  </div>;
}
