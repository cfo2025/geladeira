-- ============================================================================
-- Movimentações de estoque: reposição (entrada) e transferência entre locais.
-- Correções/balanços (incluindo saldos negativos) continuam via
-- create_stock_audit/apply_stock_audit — estas duas funções cobrem apenas
-- entradas de reposição e movimentação entre geladeiras, ambas registradas
-- em audit_logs para rastreabilidade.
-- ============================================================================

create or replace function public.restock_inventory(
  p_location_id uuid,
  p_product_id uuid,
  p_quantity int,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory inventory%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem repor estoque';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select * into v_inventory
  from inventory
  where location_id = p_location_id and product_id = p_product_id
  for update;

  if not found then
    raise exception 'Defina um preço para este produto neste local antes de repor estoque';
  end if;

  update inventory set quantity = quantity + p_quantity where id = v_inventory.id;

  perform public.log_action(
    null,
    'stock_restock',
    jsonb_build_object(
      'location_id', p_location_id,
      'product_id', p_product_id,
      'quantity', p_quantity,
      'notes', p_notes
    )
  );
end;
$$;

create or replace function public.transfer_inventory(
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_product_id uuid,
  p_quantity int,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source inventory%rowtype;
  v_dest inventory%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem transferir estoque';
  end if;

  if p_from_location_id = p_to_location_id then
    raise exception 'Escolha um local de destino diferente do local de origem';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select * into v_source
  from inventory
  where location_id = p_from_location_id and product_id = p_product_id
  for update;

  if not found or v_source.quantity < p_quantity then
    raise exception 'Estoque insuficiente no local de origem';
  end if;

  update inventory set quantity = quantity - p_quantity where id = v_source.id;

  select * into v_dest
  from inventory
  where location_id = p_to_location_id and product_id = p_product_id
  for update;

  if found then
    update inventory set quantity = quantity + p_quantity where id = v_dest.id;
  else
    insert into inventory (location_id, product_id, price, quantity)
    values (p_to_location_id, p_product_id, v_source.price, p_quantity);
  end if;

  perform public.log_action(
    null,
    'stock_transfer',
    jsonb_build_object(
      'from_location_id', p_from_location_id,
      'to_location_id', p_to_location_id,
      'product_id', p_product_id,
      'quantity', p_quantity,
      'notes', p_notes
    )
  );
end;
$$;
