begin;

-- Mengaktifkan periode dalam satu transaksi. Indeks periods_one_active hanya
-- mengizinkan satu baris is_active, jadi penonaktifan dan pengaktifan tidak
-- boleh terpisah menjadi dua permintaan yang bisa gagal di tengah jalan.
create or replace function public.set_active_period(target_period_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from periods where id = target_period_id) then
    raise exception 'Periode tidak ditemukan';
  end if;

  update periods set is_active = false where is_active and id <> target_period_id;
  update periods set is_active = true, archived_at = null where id = target_period_id;
end;
$$;

revoke all on function public.set_active_period(uuid) from public, anon;
grant execute on function public.set_active_period(uuid) to authenticated, service_role;

commit;
