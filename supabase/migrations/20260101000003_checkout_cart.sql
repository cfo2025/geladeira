-- ============================================================================
-- Checkout em lote da "Cesta de Retirada" da página /loja.
-- Processa todos os itens numa única transação: se qualquer item falhar
-- (produto não encontrado no local, estoque insuficiente), a função inteira
-- levanta exceção e o Postgres desfaz tudo — comportamento tudo-ou-nada.
--
-- p_items: [{ "product_id": "...", "location_id": "...", "quantity": 2 }, ...]
-- ============================================================================

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

    update inventory set quantity = quantity - v_quantity where id = v_inventory.id;

    insert into withdrawals (user_id, product_id, location_id, unit_price_at_withdrawal, quantity, status)
    values (auth.uid(), v_inventory.product_id, v_inventory.location_id, v_inventory.price, v_quantity, 'completed')
    returning * into v_withdrawal;

    v_total := v_total + v_inventory.price * v_quantity;
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
