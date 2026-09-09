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
import type { DashboardData } from "@/backend/dashboard-data";

const navGroups = [
  { label: "", items: [["Dashboard", "/", House]] },
  { label: "Organisasi", items: [["Anggota", "/members", Users], ["Kepengurusan", "/management", SquaresFour], ["Divisi", "/divisions", Users], ["Periode", "/periods", CalendarBlank]] },
  { label: "Program", items: [["Semua program", "/programs", ChartLineUp], ["Tugas saya", "/tasks", CheckCircle], ["Kalender", "/calendar", CalendarBlank]] },
  { label: "Operasional", items: [["Kehadiran & poin", "/attendance", UserCheck], ["Inventaris", "/inventory", Cube], ["Dokumen", "/documents", FileText], ["Log aktivitas", "/activity", List]] },
  { label: "Sistem", items: [["Akun", "/accounts", User], ["Pengaturan", "/settings", Gear]] },
] as const;



export function DashboardShell({ accountName, dashboard, content }: { accountName: string; dashboard?: DashboardData; content?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
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

        {content ?? (<div className="content">
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
function Metric({ icon: Icon, label, value, note, alert = false }: { icon: typeof House; label: string; value: string; note: string; alert?: boolean }) {
  return <article className="metric"><div className="metric-top"><span><Icon size={19} /></span><small>Periode aktif</small></div><strong>{value}</strong><h2>{label}</h2><p className={alert ? "alert" : ""}>{note}</p></article>;
}

function Activity({ initials, name, text, time }: { initials: string; name: string; text: string; time: string }) {
  return <article className="activity-item"><div className="avatar small">{initials}</div><div><p><strong>{name}</strong> {text}</p><span>{time}</span></div></article>;
}
