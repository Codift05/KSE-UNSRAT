"use client";
import { ArrowLeft, Check, Copy, FileText } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { PointEntry } from "@/backend/member-points";
import { Pagination } from "@/frontend/components/pagination";

type Data = { member: { id: string; name: string; studyProgram: string; cohortYear: string }; period: string; totalPoints: number; present: number; partial: number; permission: number; absent: number; entries: PointEntry[] };
export function MemberPointsView({ data }: { data: Data }) {
  const [page, setPage] = useState(1); const [copied, setCopied] = useState(false); const pageSize = 10;
  const rows = data.entries.slice((page - 1) * pageSize, page * pageSize);
  const copyLink = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return <div className="content points-detail-page"><Link className="back-link" href="/attendance"><ArrowLeft size={16} />Kembali ke rekap</Link><section className="page-heading"><div><h1>{data.member.name}</h1><span>{data.member.studyProgram} · Angkatan {data.member.cohortYear} · Periode {data.period}</span></div><button className="period-button share-link" onClick={copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Link disalin" : "Salin link"}</button></section>
    <section className="module-stats points-summary" aria-label="Ringkasan poin"><article><span>Total poin</span><strong>{formatPoints(data.totalPoints)}</strong><small>Periode aktif</small></article><article><span>Hadir penuh</span><strong>{data.present}</strong><small>Termasuk terlambat</small></article><article><span>Hadir sebagian</span><strong>{data.partial}</strong><small>Setengah poin</small></article><article><span>Izin / Alpa</span><strong>{data.permission} / {data.absent}</strong><small>Tanpa poin / pengurangan</small></article></section>
    <section className="panel module-table-panel"><div className="panel-heading"><div><h2>Rincian kegiatan</h2><p>Sumber perubahan poin pada periode aktif</p></div></div><div className="document-table-wrap"><table className="document-table attendance-table"><thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Pelaksanaan</th><th>Status</th><th>Poin</th><th>Bukti izin</th></tr></thead><tbody>{rows.map(entry => <tr key={entry.id}><td><strong>{entry.event}</strong></td><td>{entry.date}</td><td>{entry.mode}</td><td><em className={entry.status === "Alpa" ? "review" : "complete"}>{entry.status}</em></td><td><strong className={entry.points < 0 ? "negative-points" : ""}>{entry.points > 0 ? "+" : ""}{formatPoints(entry.points)}</strong></td><td>{entry.permissionUrl ? <a className="proof-link" href={entry.permissionUrl} target="_blank" rel="noreferrer"><FileText size={15} />Lihat</a> : "-"}</td></tr>)}{!rows.length && <tr><td className="empty-table" colSpan={6}><div className="empty-state"><div><strong>Belum ada kegiatan</strong><p>Rincian akan muncul setelah kehadiran dicatat.</p></div></div></td></tr>}</tbody></table></div>{data.entries.length > 0 && <Pagination page={page} totalPages={Math.max(1, Math.ceil(data.entries.length / pageSize))} totalItems={data.entries.length} pageSize={pageSize} onPage={setPage} />}</section>
  </div>;
}
const formatPoints = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
