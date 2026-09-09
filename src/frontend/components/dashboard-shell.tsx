"use client";

import {
  ArchiveBoxIcon as ArchiveBox,
  Bell,
  CalendarBlank,
  CaretDown,
  ChartLineUp,
  CheckCircle,
  Clock,
  Cube,
  FileText,
  FolderOpen,
  Gear,
  House,
  List,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  Users,
  UserCheck,
  User,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ModuleView, Pagination } from "@/frontend/components/module-view";
import type { DashboardData, DocumentRow } from "@/backend/dashboard-data";

const navGroups = [
  { label: "", items: [["Dashboard", "/", House]] },
  { label: "Organisasi", items: [["Anggota", "/members", Users], ["Kepengurusan", "/management", SquaresFour], ["Divisi", "/divisions", Users], ["Periode", "/periods", CalendarBlank]] },
  { label: "Program", items: [["Semua program", "/programs", ChartLineUp], ["Tugas saya", "/tasks", CheckCircle], ["Kalender", "/calendar", CalendarBlank]] },
  { label: "Operasional", items: [["Kehadiran & poin", "/attendance", UserCheck], ["Inventaris", "/inventory", Cube], ["Dokumen", "/documents", FileText], ["Log aktivitas", "/activity", List]] },
  { label: "Sistem", items: [["Akun", "/accounts", User], ["Pengaturan", "/settings", Gear]] },
] as const;



export function DashboardShell({ accountName, moduleRows, dashboard, documentRows, content }: { accountName: string; moduleRows?: string[][]; dashboard?: DashboardData; documentRows?: DocumentRow[]; content?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const isDocuments = pathname === "/documents";
  const displayName = accountName;
  const firstName = accountName.split(/\s+/)[0];
  const initials = displayName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="app-shell">
      <button className="mobile-menu" aria-label="Buka menu" onClick={() => setOpen(true)}><List size={22} /></button>
      {open && <button className="scrim" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo"><Image src="/pskse-logo-transparent.png" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
          <button className="close-menu" aria-label="Tutup menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav aria-label="Navigasi utama">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label || "utama"}>
              {group.label && <p>{group.label}</p>}
              {group.items.map(([label, href, Icon]) => (
                <Link className={pathname === href ? "nav-active" : ""} href={href} key={label} onClick={() => setOpen(false)}>
                  <Icon size={18} weight={pathname === href ? "fill" : "regular"} />{label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="account-control">
          {accountOpen && <div className="account-menu"><Link href="/profile" onClick={() => { setAccountOpen(false); setOpen(false); }}><User size={17} />Edit profil</Link><form action={logout}><button><SignOut size={17} />Keluar</button></form></div>}
          <button className="user-card" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen(value => !value)}><span className="avatar">{initials}</span><span><strong>{displayName}</strong><small>Super Admin</small></span><CaretDown className={accountOpen ? "caret-open" : ""} size={16} /></button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <label className="search"><MagnifyingGlass size={18} /><input aria-label="Cari" placeholder="Cari program, anggota, dokumen..." /></label>
          <button className="icon-button" aria-label="Notifikasi"><Bell size={20} /></button>
        </header>

        {content ?? (isDocuments ? <DocumentsView rows={documentRows} /> : pathname !== "/" ? <ModuleView path={pathname} rows={moduleRows} /> : <div className="content">
          <section className="page-heading">
            <div><p>{dashboard?.todayLabel ?? ""}</p><h1>{dashboard?.greeting ?? "Halo"}{firstName ? `, ${firstName}` : ""}.</h1><span>Berikut ringkasan organisasi hari ini.</span></div>
            <div className="heading-actions">
              <Link className="period-button" href="/periods"><CalendarBlank size={18} />{dashboard?.periodName ?? "Periode"}<CaretDown size={14} /></Link>
              <button className="primary-button"><Plus size={18} weight="bold" />Program baru</button>
            </div>
          </section>

          <section className="metrics" aria-label="Ringkasan utama">
            <Metric icon={ChartLineUp} label="Program aktif" value={String(dashboard?.activePrograms ?? 0)} note="Periode berjalan" />
            <Metric icon={CheckCircle} label="Tugas tertunda" value={String(dashboard?.pendingTasks ?? 0)} note="Belum selesai" alert={(dashboard?.pendingTasks ?? 0) > 0} />
            <Metric icon={CalendarBlank} label="Agenda mendatang" value={String(dashboard?.upcomingEvents ?? 0)} note="Jadwal berikutnya" />
            <Metric icon={Users} label="Anggota aktif" value={String(dashboard?.activeMembers ?? 0)} note="Seluruh divisi" />
          </section>

          <section className="dashboard-grid">
            <div className="panel programs-panel">
              <div className="panel-heading"><div><h2>Progress program</h2><p>Program aktif periode ini</p></div><button>Lihat semua</button></div>
              <div className="program-list">
                {dashboard?.programs.map((program) => (
                  <article className="program-row" key={program.id}>
                    <div className="program-icon"><ArchiveBox size={20} /></div>
                    <div className="program-copy"><strong>{program.name}</strong><span>{program.division}</span></div>
                    <div className="progress-cell"><div><span>Progress</span><strong>{program.progress}%</strong></div><div className="progress-track"><i style={{ width: `${program.progress}%` }} /></div></div>
                    <div className="due"><span><Clock size={14} />{program.due}</span><em>{program.status}</em></div>
                  </article>
                ))}
                {!dashboard?.programs.length && <div className="empty-state"><span><ArchiveBox size={21} /></span><div><strong>Belum ada program aktif</strong><p>Progress dihitung otomatis dari tugas yang selesai.</p></div></div>}
              </div>
            </div>

            <div className="panel attention-panel">
              <div className="panel-heading"><div><h2>Perlu perhatian</h2><p>Tindakan yang menunggumu</p></div></div>
              {!!dashboard?.overdueTasks && <div className="attention-item"><span className="attention-icon"><Clock size={19} /></span><div><strong>{dashboard.overdueTasks} tugas terlambat</strong><p>Lewati tenggat dan belum selesai</p></div><b>{dashboard.overdueTasks}</b></div>}
              {!!dashboard?.programsDueSoon && <div className="attention-item"><span className="attention-icon"><ChartLineUp size={19} /></span><div><strong>{dashboard.programsDueSoon} program mendekati tenggat</strong><p>Selesai dalam 7 hari</p></div><b>{dashboard.programsDueSoon}</b></div>}
              {!!dashboard?.overdueInventory && <div className="attention-item"><span className="attention-icon"><Cube size={19} /></span><div><strong>{dashboard.overdueInventory} inventaris terlambat</strong><p>Belum dikembalikan</p></div><b>{dashboard.overdueInventory}</b></div>}
              {!dashboard?.overdueTasks && !dashboard?.programsDueSoon && !dashboard?.overdueInventory && <div className="empty-state"><span><CheckCircle size={21} /></span><div><strong>Tidak ada yang perlu perhatian</strong><p>Semua tenggat dan peminjaman masih aman.</p></div></div>}
            </div>

            <div className="panel agenda-panel">
              <div className="panel-heading"><div><h2>Agenda terdekat</h2><p>Jadwal organisasi berikutnya</p></div><button>Buka kalender</button></div>
              <div className="agenda-list">
                {dashboard?.agenda.map((item) => <article key={item.id}><div className="date-box"><strong>{item.day}</strong><span>{item.month}</span></div><div><strong>{item.title}</strong><p>{item.meta}</p></div></article>)}
                {!dashboard?.agenda.length && <div className="empty-state"><span><CalendarBlank size={21} /></span><div><strong>Belum ada agenda</strong><p>Kegiatan yang akan datang muncul di sini.</p></div></div>}
              </div>
            </div>

            <div className="panel activity-panel">
              <div className="panel-heading"><div><h2>Aktivitas terbaru</h2><p>Pembaruan dari tim</p></div><button>Lihat log</button></div>
              {dashboard?.activity.map((item) => <Activity initials={item.initials} name={item.name} text={item.text} time={item.time} key={item.id} />)}
              {!dashboard?.activity.length && <div className="empty-state"><span><List size={21} /></span><div><strong>Belum ada aktivitas</strong><p>Perubahan penting pada sistem tercatat di sini.</p></div></div>}
            </div>
          </section>
        </div>)}
      </main>
    </div>
  );
}

const documents = [
  { title: "Proposal KSE Mengajar", category: "Proposal", program: "KSE Mengajar", owner: "Miftah S.", updated: "Hari ini, 09.42", status: "Lengkap" },
  { title: "LPJ Sharing Session", category: "LPJ", program: "Sharing Session", owner: "Vinny Moningka", updated: "Kemarin, 16.10", status: "Lengkap" },
  { title: "Notulen Rapat Pengurus", category: "Notulen", program: "Organisasi", owner: "Ezra Mandagi", updated: "5 Sep 2026", status: "Perlu review" },
  { title: "SK Kepengurusan 2026-2027", category: "SK", program: "Organisasi", owner: "Fitra Maulana", updated: "1 Sep 2026", status: "Lengkap" },
];

function DocumentsView({ rows }: { rows?: DocumentRow[] }) {
  const sourceRows = rows ?? documents;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredRows = sourceRows.filter(item => (!category || item.category === category) && Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  return <div className="content documents-page">
    <section className="page-heading">
      <div><h1>Dokumen</h1><span>Monitor kelengkapan dan akses seluruh dokumentasi KSE Unsrat.</span></div>
      <button className="primary-button standalone"><Plus size={18} weight="bold" />Tambah dokumen</button>
    </section>

    <section className="document-summary" aria-label="Ringkasan dokumen">
      <div><span>Total dokumen</span><strong>{sourceRows.length}</strong><small>Periode aktif</small></div>
      <div><span>Dokumen lengkap</span><strong>{sourceRows.filter(item => item.status === "Lengkap").length}</strong><small>Metadata terindeks</small></div>
      <div><span>Perlu ditinjau</span><strong>{sourceRows.filter(item => item.status !== "Lengkap").length}</strong><small>Menunggu verifikasi</small></div>
      <div className="drive-state"><span>Status penyimpanan</span><strong>Google Drive</strong><small>Tersambung</small></div>
    </section>

    <section className="panel document-library">
      <div className="panel-heading document-toolbar"><div><h2>Semua dokumen</h2><p>Metadata arsip pada periode aktif</p></div><div className="document-actions"><label className="table-search"><MagnifyingGlass size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Cari dokumen" placeholder="Cari dokumen..." /></label><select aria-label="Filter kategori" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">Semua kategori</option><option>Proposal</option><option>LPJ</option><option>Notulen</option><option>SK</option></select></div></div>
      <div className="document-table-wrap"><table className="document-table"><thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Program</th><th>Pengunggah</th><th>Diperbarui</th><th>Status</th></tr></thead><tbody>{visibleRows.map(doc => <tr key={doc.title}><td><span className="file-icon"><FileText size={18} /></span><strong>{doc.title}</strong></td><td>{doc.category}</td><td>{doc.program}</td><td>{doc.owner}</td><td>{doc.updated}</td><td><em className={doc.status === "Lengkap" ? "complete" : "review"}>{doc.status}</em></td></tr>)}{visibleRows.length === 0 && <tr><td className="empty-table" colSpan={6}><div className="empty-state"><span><FolderOpen size={21} /></span><div><strong>{query || category ? "Dokumen tidak ditemukan" : "Belum ada dokumen"}</strong><p>{query || category ? "Ubah pencarian atau filter kategori." : "Hubungkan Google Drive, lalu tambahkan dokumen pertama."}</p></div></div></td></tr>}</tbody></table></div>
      {filteredRows.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPage={setPage} />}
    </section>

    <section className="panel folder-panel">
      <div className="panel-heading"><div><h2>Folder dokumentasi kegiatan</h2><p>Foto dan video disimpan langsung di Google Drive</p></div><button>Buka Drive</button></div>
      <div className="folder-grid"><Folder name="KSE Mengajar" count="127 file" updated="18 Sep 2026" /><Folder name="Sharing Session" count="84 file" updated="12 Sep 2026" /><Folder name="Welcoming Scholars" count="36 file" updated="2 Sep 2026" /></div>
    </section>
  </div>;
}

function Folder({ name, count, updated }: { name: string; count: string; updated: string }) {
  return <article><span><ArchiveBox size={22} /></span><div><strong>{name}</strong><p>{count} · Diperbarui {updated}</p></div></article>;
}

function Metric({ icon: Icon, label, value, note, alert = false }: { icon: typeof House; label: string; value: string; note: string; alert?: boolean }) {
  return <article className="metric"><div className="metric-top"><span><Icon size={19} /></span><small>Periode aktif</small></div><strong>{value}</strong><h2>{label}</h2><p className={alert ? "alert" : ""}>{note}</p></article>;
}

function Activity({ initials, name, text, time }: { initials: string; name: string; text: string; time: string }) {
  return <article className="activity-item"><div className="avatar small">{initials}</div><div><p><strong>{name}</strong> {text}</p><span>{time}</span></div></article>;
}
