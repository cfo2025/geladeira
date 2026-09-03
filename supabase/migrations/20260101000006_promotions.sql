-- ============================================================================
-- Promoções: preço promocional opcional por (local, produto). Quando ativo
-- (promo_price não nulo), o valor efetivamente cobrado na retirada passa a
-- ser o promocional em vez do preço cheio — create_withdrawal (legado) e
-- checkout_withdrawal_cart (usado pelo app) são atualizadas para refletir
-- isso no snapshot gravado em withdrawals.unit_price_at_withdrawal.
-- ============================================================================

alter table inventory add column promo_price numeric(10,2);
alter table inventory add constraint inventory_promo_price_lt_price
  check (promo_price is null or (promo_price >= 0 and promo_price < price));

-- Retirada individual (legado, sem uso direto no app hoje, mantida coerente).
create or replace function public.create_withdrawal(
  p_product_id uuid,
  p_location_id uuid,
  p_quantity int default 1
)
returns withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory inventory%rowtype;
  v_withdrawal withdrawals%rowtype;
  v_unit_price numeric;
begin
  if not public.is_active_user() then
    raise exception 'Usuário inativo';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select * into v_inventory
  from inventory
  where product_id = p_product_id and location_id = p_location_id
  for update;

  if not found then
    raise exception 'Produto não disponível neste local';
  end if;

  if v_inventory.quantity < p_quantity then
    raise exception 'Estoque insuficiente';
  end if;

  v_unit_price := coalesce(v_inventory.promo_price, v_inventory.price);

  update inventory set quantity = quantity - p_quantity where id = v_inventory.id;

  insert into withdrawals (user_id, product_id, location_id, unit_price_at_withdrawal, quantity, status)
  values (auth.uid(), p_product_id, p_location_id, v_unit_price, p_quantity, 'completed')
  returning * into v_withdrawal;

  return v_withdrawal;
end;
$$;

-- Checkout em lote da cesta — usado pela página /loja e pelo modal de lançamento.
create or replace function public.checkout_withdrawal_cart(p_items jsonb)
returns setof withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_inventory inventory%rowtype;
  v_withdrawal withdrawals%rowtype;
  v_quantity int;
  v_unit_price numeric;
  v_total numeric := 0;
  v_count int := 0;
begin
  if not public.is_active_user() then
    raise exception 'Usuário inativo';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cesta vazia';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantidade inválida';
    end if;

    select * into v_inventory
    from inventory
    where product_id = (v_item->>'product_id')::uuid
      and location_id = (v_item->>'location_id')::uuid
    for update;

    if not found then
      raise exception 'Produto não disponível neste local';
    end if;

    if v_inventory.quantity < v_quantity then
      raise exception 'Estoque insuficiente';
    end if;

    v_unit_price := coalesce(v_inventory.promo_price, v_inventory.price);

    update inventory set quantity = quantity - v_quantity where id = v_inventory.id;

    insert into withdrawals (user_id, product_id, location_id, unit_price_at_withdrawal, quantity, status)
    values (auth.uid(), v_inventory.product_id, v_inventory.location_id, v_unit_price, v_quantity, 'completed')
    returning * into v_withdrawal;

    v_total := v_total + v_unit_price * v_quantity;
    v_count := v_count + 1;

    return next v_withdrawal;
  end loop;

  perform public.notify(
    auth.uid(),
    'Retirada registrada',
    format('%s item(ns) retirado(s), totalizando R$ %s.', v_count, round(v_total, 2)::text)
  );

  return;
end;
$$;
