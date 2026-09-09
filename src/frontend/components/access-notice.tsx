import { Lock } from "@phosphor-icons/react/dist/ssr";

export function AccessNotice({ title, description, reason }: { title: string; description: string; reason: string }) {
  return <div className="content accounts-page">
    <section className="page-heading"><div><h1>{title}</h1><span>{description}</span></div></section>
    <section className="panel module-table-panel">
      <div className="empty-state"><span><Lock size={21} /></span><div><strong>Halaman ini belum dapat kamu buka</strong><p>{reason}</p></div></div>
    </section>
  </div>;
}
