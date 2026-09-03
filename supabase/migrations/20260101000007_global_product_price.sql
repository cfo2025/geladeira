-- ============================================================================
-- Preço (e promoção) passam a ser do produto, não da geladeira: o mesmo
-- produto custa o mesmo em todas as geladeiras — só a quantidade em estoque
-- varia por local. Move price/promo_price de inventory para products e
-- atualiza as funções de retirada e movimentação de acordo.
-- ============================================================================

alter table products add column price numeric(10,2) not null default 0 check (price >= 0);
alter table products add column promo_price numeric(10,2);
alter table products add constraint products_promo_price_lt_price
  check (promo_price is null or (promo_price >= 0 and promo_price < price));

-- Backfill: usa o maior preço já cadastrado do produto em qualquer geladeira
-- (e a primeira promoção ativa encontrada, se houver) como valor inicial.
update products p
  set price = coalesce((select max(i.price) from inventory i where i.product_id = p.id), 0),
      promo_price = (
        select i.promo_price from inventory i
        where i.product_id = p.id and i.promo_price is not null
        limit 1
      );

alter table inventory drop constraint if exists inventory_promo_price_lt_price;
alter table inventory drop column if exists promo_price;
alter table inventory drop column if exists price;

-- Retirada individual (legado) — preço/promoção agora vêm do produto.
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
  v_product products%rowtype;
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

  select * into v_product from products where id = p_product_id;
  v_unit_price := coalesce(v_product.promo_price, v_product.price);

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
  v_product products%rowtype;
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

    select * into v_product from products where id = v_inventory.product_id;
    v_unit_price := coalesce(v_product.promo_price, v_product.price);

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

-- Repor estoque: agora cria a linha de inventory se ainda não existir (o
-- preço já existe sempre no produto, não depende mais de haver preço
-- cadastrado para esta geladeira especificamente).
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
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem repor estoque';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  insert into inventory (location_id, product_id, quantity)
  values (p_location_id, p_product_id, p_quantity)
  on conflict (location_id, product_id) do update set quantity = inventory.quantity + p_quantity;

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

-- Transferir estoque entre geladeiras — sem preço para copiar (é do produto).
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

  insert into inventory (location_id, product_id, quantity)
  values (p_to_location_id, p_product_id, p_quantity)
  on conflict (location_id, product_id) do update set quantity = inventory.quantity + p_quantity;

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
