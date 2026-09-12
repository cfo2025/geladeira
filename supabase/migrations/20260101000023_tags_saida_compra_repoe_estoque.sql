-- ============================================================================
-- Tags de saída de caixa (Empenho/Bônus/Descaminho) + compra de produto
-- passa a repor estoque automaticamente + libera compra pro ordenador de
-- despesa também (antes só admin).
--
-- - expense_outflows.tag: categoriza toda saída em 'empenho' (uso normal/
--   planejado), 'bonus' (gratificação) ou 'descaminho' (prejuízo — sumiço/
--   furto não lançado como retirada). Extrato público mostra a tag pra
--   todo mundo entender pra onde o dinheiro foi.
-- - register_product_purchase agora também soma a quantidade comprada no
--   estoque — como só existe um local ativo hoje, resolve ele sozinho;
--   se um dia houver mais de um local ativo ao mesmo tempo, a função
--   passa a exigir que o local seja informado explicitamente (evita
--   repor estoque no local errado silenciosamente).
-- - is_expense_orderer() (admin OU ordenador_despesa) passa a valer
--   também pra registrar compra de produto, não só admin.
-- ============================================================================

alter table expense_outflows add column if not exists tag text not null default 'empenho'
  check (tag in ('empenho', 'bonus', 'descaminho'));

drop function if exists public.create_expense_outflow(numeric, text, text, text);

create function public.create_expense_outflow(
  p_valor numeric,
  p_local_destinado text,
  p_responsavel_retirada text,
  p_tag text,
  p_observacoes text default null
)
returns expense_outflows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
  v_row expense_outflows%rowtype;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem lançar saídas de caixa';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor inválido';
  end if;

  if p_local_destinado is null or btrim(p_local_destinado) = '' then
    raise exception 'Informe o local/finalidade da despesa';
  end if;

  if p_responsavel_retirada is null or btrim(p_responsavel_retirada) = '' then
    raise exception 'Informe o responsável pela retirada';
  end if;

  if p_tag not in ('empenho', 'bonus', 'descaminho') then
    raise exception 'Tag inválida';
  end if;

  select
    coalesce((select sum(admin_typed_amount) from payments where status = 'approved'), 0)
    - coalesce((select sum(valor) from expense_outflows), 0)
  into v_available;

  if p_valor > v_available then
    raise exception 'Valor maior que o saldo em caixa disponível (R$ %)', to_char(v_available, 'FM999999990.00');
  end if;

  insert into expense_outflows (valor, local_destinado, responsavel_retirada, tag, criado_por_id, observacoes)
  values (p_valor, btrim(p_local_destinado), btrim(p_responsavel_retirada), p_tag, auth.uid(), nullif(btrim(coalesce(p_observacoes, '')), ''))
  returning * into v_row;

  perform public.log_action(null, 'expense_created', jsonb_build_object(
    'expense_id', v_row.id,
    'valor', p_valor,
    'local_destinado', v_row.local_destinado,
    'responsavel_retirada', v_row.responsavel_retirada,
    'tag', p_tag
  ));

  return v_row;
end;
$$;

-- register_product_purchase: agora também soma no estoque (repõe
-- automaticamente no único local ativo) e passa a valer pra ordenador de
-- despesa também, não só admin.
create or replace function public.register_product_purchase(
  p_product_id uuid,
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
  v_row product_purchases%rowtype;
  v_avg_cost numeric;
  v_location_id uuid;
  v_active_count int;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem registrar compras de produto';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  if p_unit_cost is null or p_unit_cost <= 0 then
    raise exception 'Valor pago inválido';
  end if;

  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Produto não encontrado';
  end if;

  select count(*) into v_active_count from locations where is_active = true;
  if v_active_count = 0 then
    raise exception 'Nenhum local ativo para repor estoque';
  elsif v_active_count > 1 then
    raise exception 'Existe mais de um local ativo — repor estoque automaticamente não é seguro nesse caso';
  end if;
  select id into v_location_id from locations where is_active = true limit 1;

  insert into product_purchases (product_id, quantity, unit_cost, criado_por_id, observacoes)
  values (p_product_id, p_quantity, p_unit_cost, auth.uid(), nullif(btrim(coalesce(p_observacoes, '')), ''))
  returning * into v_row;

  select sum(unit_cost * quantity) / sum(quantity) into v_avg_cost
  from product_purchases
  where product_id = p_product_id;

  update products set cost_price = v_avg_cost where id = p_product_id;

  insert into inventory (location_id, product_id, quantity)
  values (v_location_id, p_product_id, p_quantity)
  on conflict (location_id, product_id) do update set quantity = inventory.quantity + p_quantity;

  perform public.log_action(null, 'product_purchase_created', jsonb_build_object(
    'purchase_id', v_row.id,
    'product_id', p_product_id,
    'location_id', v_location_id,
    'quantity', p_quantity,
    'unit_cost', p_unit_cost,
    'avg_cost', v_avg_cost
  ));

  return v_row;
end;
$$;

-- product_purchases: escrita agora também pra ordenador de despesa (era só admin).
drop policy if exists "product_purchases_admin_write" on product_purchases;
drop policy if exists "product_purchases_write_expense_orderer" on product_purchases;
create policy "product_purchases_write_expense_orderer" on product_purchases for all
  using (public.is_expense_orderer()) with check (public.is_expense_orderer());
