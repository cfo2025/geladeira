-- ============================================================================
-- Editar e excluir compra de produto (admin/ordenador de despesa), com log
-- de auditoria completo — igual ao que já existe pra saída de caixa. Como a
-- compra soma automaticamente no estoque (único local ativo) e recalcula o
-- custo médio ponderado do produto, editar/excluir precisa desfazer/refazer
-- esses dois efeitos com cuidado:
--
-- - Só funciona com exatamente 1 local ativo (mesma trava de
--   register_product_purchase) — com 0 ou 2+ locais ativos não dá pra saber
--   com segurança de onde tirar/pôr o estoque, aí é preciso ajustar manual
--   em "Repor estoque"/"Transferir estoque".
-- - Se parte do estoque dessa compra já foi retirada/transferida (o saldo
--   atual no local é menor que a quantidade da compra), bloqueia a edição
--   pra menos ou a exclusão — não dá pra tirar estoque que não existe mais.
-- - custo médio ponderado é recalculado sobre as compras restantes desse
--   produto; se não sobrar nenhuma, volta pra 0 (não pode ser null).
-- ============================================================================

create or replace function public.update_product_purchase(
  p_id uuid,
  p_quantity int,
  p_unit_cost numeric,
  p_observacoes text default null
)
returns product_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old product_purchases%rowtype;
  v_new product_purchases%rowtype;
  v_avg_cost numeric;
  v_location_id uuid;
  v_active_count int;
  v_current_stock int;
  v_delta int;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem editar compras de produto';
  end if;

  select * into v_old from product_purchases where id = p_id for update;
  if not found then
    raise exception 'Compra não encontrada';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  if p_unit_cost is null or p_unit_cost <= 0 then
    raise exception 'Valor pago inválido';
  end if;

  select count(*) into v_active_count from locations where is_active = true;
  if v_active_count = 0 then
    raise exception 'Nenhum local ativo para ajustar o estoque';
  elsif v_active_count > 1 then
    raise exception 'Existe mais de um local ativo — ajustar estoque automaticamente não é seguro nesse caso';
  end if;
  select id into v_location_id from locations where is_active = true limit 1;

  v_delta := p_quantity - v_old.quantity;

  if v_delta < 0 then
    select coalesce(quantity, 0) into v_current_stock
    from inventory where location_id = v_location_id and product_id = v_old.product_id;

    if coalesce(v_current_stock, 0) < abs(v_delta) then
      raise exception 'Não é possível reduzir a quantidade: parte do estoque desta compra já foi retirado ou transferido';
    end if;
  end if;

  update product_purchases
    set quantity = p_quantity,
        unit_cost = p_unit_cost,
        observacoes = nullif(btrim(coalesce(p_observacoes, '')), '')
    where id = p_id
    returning * into v_new;

  update inventory set quantity = quantity + v_delta
    where location_id = v_location_id and product_id = v_old.product_id;

  select coalesce(sum(unit_cost * quantity) / nullif(sum(quantity), 0), 0) into v_avg_cost
  from product_purchases
  where product_id = v_old.product_id;

  update products set cost_price = v_avg_cost where id = v_old.product_id;

  perform public.log_action(null, 'product_purchase_updated', jsonb_build_object(
    'purchase_id', p_id,
    'product_id', v_old.product_id,
    'before', jsonb_build_object('quantity', v_old.quantity, 'unit_cost', v_old.unit_cost),
    'after', jsonb_build_object('quantity', v_new.quantity, 'unit_cost', v_new.unit_cost),
    'avg_cost', v_avg_cost
  ));

  return v_new;
end;
$$;

create or replace function public.delete_product_purchase(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row product_purchases%rowtype;
  v_avg_cost numeric;
  v_location_id uuid;
  v_active_count int;
  v_current_stock int;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem excluir compras de produto';
  end if;

  select * into v_row from product_purchases where id = p_id for update;
  if not found then
    raise exception 'Compra não encontrada';
  end if;

  select count(*) into v_active_count from locations where is_active = true;
  if v_active_count = 0 then
    raise exception 'Nenhum local ativo para ajustar o estoque';
  elsif v_active_count > 1 then
    raise exception 'Existe mais de um local ativo — ajustar estoque automaticamente não é seguro nesse caso';
  end if;
  select id into v_location_id from locations where is_active = true limit 1;

  select coalesce(quantity, 0) into v_current_stock
  from inventory where location_id = v_location_id and product_id = v_row.product_id;

  if coalesce(v_current_stock, 0) < v_row.quantity then
    raise exception 'Não é possível excluir: parte do estoque desta compra já foi retirado ou transferido';
  end if;

  delete from product_purchases where id = p_id;

  update inventory set quantity = quantity - v_row.quantity
    where location_id = v_location_id and product_id = v_row.product_id;

  select coalesce(sum(unit_cost * quantity) / nullif(sum(quantity), 0), 0) into v_avg_cost
  from product_purchases
  where product_id = v_row.product_id;

  update products set cost_price = v_avg_cost where id = v_row.product_id;

  perform public.log_action(null, 'product_purchase_deleted', jsonb_build_object(
    'purchase_id', v_row.id,
    'product_id', v_row.product_id,
    'quantity', v_row.quantity,
    'unit_cost', v_row.unit_cost,
    'observacoes', v_row.observacoes,
    'data_hora', v_row.data_hora,
    'avg_cost', v_avg_cost
  ));
end;
$$;
