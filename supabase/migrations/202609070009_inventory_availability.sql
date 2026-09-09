begin;

-- available_quantity sebelumnya tidak pernah diperbarui oleh siapa pun, sehingga
-- stok tidak pernah berkurang ketika barang dipinjam. Perhitungannya diletakkan
-- di database, bukan di server action, agar dua persetujuan yang berbarengan
-- tidak saling menimpa dan menghasilkan stok yang salah.
create or replace function public.sync_inventory_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_item uuid;
  taken_before integer := 0;
  taken_after integer := 0;
  delta integer;
begin
  target_item := coalesce(new.item_id, old.item_id);

  if tg_op in ('UPDATE', 'DELETE') then
    taken_before := case when old.status = 'borrowed' then old.quantity else 0 end;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    taken_after := case when new.status = 'borrowed' then new.quantity else 0 end;
  end if;

  -- Perpindahan barang antar item pada satu transaksi tidak didukung; kembalikan
  -- stok item lama secara utuh lebih dulu.
  if tg_op = 'UPDATE' and old.item_id <> new.item_id then
    update inventory_items set available_quantity = available_quantity + taken_before, updated_at = now() where id = old.item_id;
    taken_before := 0;
  end if;

  delta := taken_after - taken_before;
  if delta <> 0 then
    update inventory_items
    set available_quantity = available_quantity - delta,
        updated_at = now()
    where id = target_item;
  end if;

  -- Status barang hanya berpindah antara tersedia dan dipinjam. Kondisi lain
  -- (perbaikan, rusak, hilang) ditetapkan manual dan tidak boleh ditimpa.
  update inventory_items
  set status = case when available_quantity = 0 then 'borrowed' else 'available' end
  where id = target_item and status in ('available', 'borrowed');

  return coalesce(new, old);
end;
$$;

drop trigger if exists inventory_sync_availability on public.inventory_transactions;
create trigger inventory_sync_availability
  after insert or update or delete on public.inventory_transactions
  for each row execute function public.sync_inventory_availability();

commit;
