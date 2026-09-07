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
  Gear,
  House,
  List,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  Users,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { logout } from "@/app/login/actions";
import { ModuleView } from "@/components/module-view";
import type { DashboardData, DocumentRow } from "@/lib/dashboard-data";

const navGroups = [
  { label: "", items: [["Dashboard", "/", House]] },
  { label: "Organisasi", items: [["Anggota", "/members", Users], ["Kepengurusan", "/management", SquaresFour], ["Divisi", "/divisions", Users], ["Periode", "/periods", CalendarBlank]] },
  { label: "Program", items: [["Semua program", "/programs", ChartLineUp], ["Tugas saya", "/tasks", CheckCircle], ["Kalender", "/calendar", CalendarBlank]] },
  { label: "Operasional", items: [["Inventaris", "/inventory", Cube], ["Dokumen", "/documents", FileText], ["Log aktivitas", "/activity", List]] },
  { label: "Sistem", items: [["Pengaturan", "/settings", Gear]] },
] as const;

const programs = [
  { name: "KSE Mengajar", division: "Community Development", progress: 82, due: "18 Sep", status: "Berjalan" },
  { name: "Sharing Session", division: "Education", progress: 64, due: "24 Sep", status: "Berjalan" },
  { name: "Welcoming Scholars", division: "Internal Development", progress: 35, due: "2 Okt", status: "Perencanaan" },
];

const agenda = [
  { day: "08", month: "SEP", title: "Rapat Pengurus", meta: "19.00 · Sekretariat" },
  { day: "12", month: "SEP", title: "Sharing Session", meta: "15.30 · Aula FEB" },
  { day: "18", month: "SEP", title: "KSE Mengajar", meta: "09.00 · SD Inpres Malalayang" },
];

export function DashboardShell({ moduleRows, dashboard, documentRows }: { moduleRows?: string[][]; dashboard?: DashboardData; documentRows?: DocumentRow[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isDocuments = pathname === "/documents";

  return (
    <div className="app-shell">
      <button className="mobile-menu" aria-label="Buka menu" onClick={() => setOpen(true)}><List size={22} /></button>
      {open && <button className="scrim" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo"><Image src="/pskse-logo.png" alt="Sabua Paguyuban KSE Unsrat" width={388} height={216} priority /></div>
          <button className="close-menu" aria-label="Tutup menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav aria-label="Navigasi utama">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label || "utama"}>
              {group.label && <p>{group.label}</p>}
              {group.items.map(([label, href, Icon]) => (
                <button className={pathname === href ? "nav-active" : ""} key={label} onClick={() => {
                  router.push(href);
                  setOpen(false);
                }}>
                  <Icon size={18} weight={pathname === href ? "fill" : "regular"} />{label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <form action={logout} className="user-card">
          <div className="avatar">FM</div><div><strong>Fitra Maulana</strong><span>Super Admin</span></div><button title="Keluar" aria-label="Keluar dari akun"><CaretDown size={16} /></button>
        </form>
      </aside>

      <main>
        <header className="topbar">
          <label className="search"><MagnifyingGlass size={18} /><input aria-label="Cari" placeholder="Cari program, anggota, dokumen..." /></label>
          <button className="icon-button" aria-label="Notifikasi"><Bell size={20} /></button>
        </header>

        {isDocuments ? <DocumentsView rows={documentRows} /> : pathname !== "/" ? <ModuleView path={pathname} rows={moduleRows} /> : <div className="content">
          <section className="page-heading">
            <div><p>Senin, 7 September 2026</p><h1>Selamat pagi, Fitra.</h1><span>Berikut ringkasan organisasi hari ini.</span></div>
            <div className="heading-actions">
              <button className="period-button"><CalendarBlank size={18} />Periode 2026-2027<CaretDown size={14} /></button>
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
                {programs.map((program) => (
                  <article className="program-row" key={program.name}>
                    <div className="program-icon"><ArchiveBox size={20} /></div>
                    <div className="program-copy"><strong>{program.name}</strong><span>{program.division}</span></div>
                    <div className="progress-cell"><div><span>Progress</span><strong>{program.progress}%</strong></div><div className="progress-track"><i style={{ width: `${program.progress}%` }} /></div></div>
                    <div className="due"><span><Clock size={14} />{program.due}</span><em>{program.status}</em></div>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel attention-panel">
              <div className="panel-heading"><div><h2>Perlu perhatian</h2><p>Tindakan yang menunggumu</p></div></div>
              <div className="attention-item"><span className="attention-icon"><Clock size={19} /></span><div><strong>3 tugas terlambat</strong><p>Lewati tenggat dan belum selesai</p></div><b>3</b></div>
              <div className="attention-item"><span className="attention-icon"><ChartLineUp size={19} /></span><div><strong>1 program mendekati tenggat</strong><p>Selesai dalam 7 hari</p></div><b>1</b></div>
              <div className="attention-item"><span className="attention-icon"><Cube size={19} /></span><div><strong>2 inventaris terlambat</strong><p>Belum dikembalikan</p></div><b>2</b></div>
            </div>

            <div className="panel agenda-panel">
              <div className="panel-heading"><div><h2>Agenda terdekat</h2><p>Jadwal organisasi berikutnya</p></div><button>Buka kalender</button></div>
              <div className="agenda-list">
                {agenda.map((item) => <article key={item.title}><div className="date-box"><strong>{item.day}</strong><span>{item.month}</span></div><div><strong>{item.title}</strong><p>{item.meta}</p></div></article>)}
              </div>
            </div>

            <div className="panel activity-panel">
              <div className="panel-heading"><div><h2>Aktivitas terbaru</h2><p>Pembaruan dari tim</p></div><button>Lihat log</button></div>
              <Activity initials="EM" name="Ezra Mandagi" text="mengubah status KSE Mengajar menjadi Berjalan" time="10 menit lalu" />
              <Activity initials="VM" name="Vinny Moningka" text="mengunggah LPJ Sharing Session" time="45 menit lalu" />
              <Activity initials="MS" name="Miftah S." text="menambahkan anggota baru ke divisi Education" time="2 jam lalu" />
            </div>
          </section>
        </div>}
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
  const visibleRows = rows ?? documents;
  return <div className="content documents-page">
    <section className="page-heading">
      <div><p>ARSIP ORGANISASI</p><h1>Dokumen</h1><span>Monitor kelengkapan dan akses seluruh dokumentasi KSE Unsrat.</span></div>
      <button className="primary-button standalone"><Plus size={18} weight="bold" />Tambah dokumen</button>
    </section>

    <section className="document-summary" aria-label="Ringkasan dokumen">
      <div><span>Total dokumen</span><strong>{visibleRows.length}</strong><small>Periode aktif</small></div>
      <div><span>Dokumen lengkap</span><strong>{visibleRows.filter(item => item.status === "Lengkap").length}</strong><small>Metadata terindeks</small></div>
      <div><span>Perlu ditinjau</span><strong>{visibleRows.filter(item => item.status !== "Lengkap").length}</strong><small>Menunggu verifikasi</small></div>
      <div className="drive-state"><span>Status penyimpanan</span><strong>Google Drive</strong><small>Tersambung</small></div>
    </section>

    <section className="panel document-library">
      <div className="panel-heading document-toolbar"><div><h2>Semua dokumen</h2><p>Metadata arsip pada periode aktif</p></div><div className="document-actions"><label className="table-search"><MagnifyingGlass size={17} /><input aria-label="Cari dokumen" placeholder="Cari dokumen..." /></label><select aria-label="Filter kategori" defaultValue=""><option value="">Semua kategori</option><option>Proposal</option><option>LPJ</option><option>Notulen</option><option>SK</option></select></div></div>
      <div className="document-table-wrap"><table className="document-table"><thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Program</th><th>Pengunggah</th><th>Diperbarui</th><th>Status</th></tr></thead><tbody>{visibleRows.map(doc => <tr key={doc.title}><td><span className="file-icon"><FileText size={18} /></span><strong>{doc.title}</strong></td><td>{doc.category}</td><td>{doc.program}</td><td>{doc.owner}</td><td>{doc.updated}</td><td><em className={doc.status === "Lengkap" ? "complete" : "review"}>{doc.status}</em></td></tr>)}{visibleRows.length === 0 && <tr><td className="empty-table" colSpan={6}>Belum ada dokumen. Tambahkan dokumen pertama setelah Google Drive dikonfigurasi.</td></tr>}</tbody></table></div>
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
