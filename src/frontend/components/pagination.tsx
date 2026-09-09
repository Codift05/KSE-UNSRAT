"use client";

export function Pagination({ page, totalPages, totalItems, pageSize, onPage }: { page: number; totalPages: number; totalItems: number; pageSize: number; onPage: (page: number) => void }) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return <nav className="pagination" aria-label="Navigasi halaman tabel"><span>Menampilkan {first}-{last} dari {totalItems}</span><div><button onClick={() => onPage(page - 1)} disabled={page === 1}>Sebelumnya</button><strong>{page} / {totalPages}</strong><button onClick={() => onPage(page + 1)} disabled={page === totalPages}>Berikutnya</button></div></nav>;
}
