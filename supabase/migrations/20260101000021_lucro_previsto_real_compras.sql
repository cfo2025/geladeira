-- ============================================================================
-- Compras de produto + lucro previsto/real
--
-- - product_purchases: lançamento de compra (produto, quantidade, valor
--   pago por unidade, data, quem lançou). Puramente pra apurar custo/lucro
--   — NÃO repõe estoque (isso continua sendo feito à parte, em "Repor
--   estoque") e NÃO desconta do saldo em caixa (isso continua sendo feito
--   à parte, em "Lançar despesa", se o admin quiser refletir a saída).
-- - products.cost_price passa a ser o custo médio ponderado, recalculado a
--   cada compra registrada (soma(valor pago × qtd) / soma(qtd), sobre todo
--   o histórico de compras do produto). Continua editável manualmente
--   também (o board decidiu manter os dois caminhos) — nesse caso vale o
--   último valor gravado, até a próxima compra recalcular.
-- - Um produto só entra nos cálculos de lucro quando cost_price > 0 — ou
--   seja, o módulo começa zerado e só passa a contar lucro pros produtos
--   que já tiveram compra registrada (ou custo definido manualmente).
-- - Lucro previsto = valor de venda atual − custo médio, aplicado à
--   quantidade que está em estoque agora (o que ainda não foi vendido).
-- - Lucro real = valor de venda no momento da retirada − custo médio
--   atual, aplicado às retiradas não canceladas já feitas.
-- ============================================================================

create table product_purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost > 0),
  data_hora timestamptz not null default now(),
  criado_por_id uuid not null references profiles(id),
  observacoes text,
  created_at timestamptz not null default now()
);

create index idx_product_purchases_product on product_purchases(product_id);
create index idx_product_purchases_data_hora on product_purchases(data_hora desc);

alter table product_purchases enable row level security;

create policy "product_purchases_select_active_users" on product_purchases for select
  using (public.is_active_user());
-- Escrita só admin (mesmo critério de quem edita custo manualmente em Estoque)
-- — defesa em profundidade, o caminho normal é register_product_purchase.
create policy "product_purchases_admin_write" on product_purchases for all
  using (public.is_admin()) with check (public.is_admin());

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
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem registrar compras de produto';
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

  insert into product_purchases (product_id, quantity, unit_cost, criado_por_id, observacoes)
  values (p_product_id, p_quantity, p_unit_cost, auth.uid(), nullif(btrim(coalesce(p_observacoes, '')), ''))
  returning * into v_row;

  select sum(unit_cost * quantity) / sum(quantity) into v_avg_cost
  from product_purchases
  where product_id = p_product_id;

  update products set cost_price = v_avg_cost where id = p_product_id;

  perform public.log_action(null, 'product_purchase_created', jsonb_build_object(
    'purchase_id', v_row.id,
    'product_id', p_product_id,
    'quantity', p_quantity,
    'unit_cost', p_unit_cost,
    'avg_cost', v_avg_cost
  ));

  return v_row;
end;
$$;

-- Substitui o resumo anterior (que tinha um único "estimated_profit"
-- calculado com coalesce(cost_price, 0) — contando o preço cheio como
-- lucro pra qualquer produto sem custo definido). Agora exige cost_price
-- > 0 pra entrar na conta, e separa lucro previsto (estoque parado) de
-- lucro real (já vendido).
create or replace function public.get_transparency_summary()
returns table(
  total_collected numeric,
  total_outflows numeric,
  available_balance numeric,
  projected_profit numeric,
  realized_profit numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'Não autorizado';
  end if;

  return query
    select
      collected.total,
      outflows.total,
      collected.total - outflows.total,
      projected.total,
      realized.total
    from
      (select coalesce(sum(admin_typed_amount), 0)::numeric as total from payments where status = 'approved') collected,
      (select coalesce(sum(valor), 0)::numeric as total from expense_outflows) outflows,
      (
        select coalesce(sum((coalesce(p.promo_price, p.price) - p.cost_price) * inv.quantity), 0)::numeric as total
        from inventory inv
        join products p on p.id = inv.product_id
        where p.cost_price > 0
      ) projected,
      (
        select coalesce(sum((w.unit_price_at_withdrawal - p.cost_price) * w.quantity), 0)::numeric as total
        from withdrawals w
        join products p on p.id = w.product_id
        where w.status <> 'cancelled' and p.cost_price > 0
      ) realized;
end;
$$;
