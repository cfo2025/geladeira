-- ============================================================================
-- Módulo de Transparência e Fluxo de Caixa
--
-- - Novo papel 'ordenador_despesa': junto com 'admin', pode lançar saídas de
--   caixa (despesas) e ver o formulário de lançamento. Todo usuário ativo
--   (qualquer papel) pode ver a tela de transparência (saldo + extrato).
-- - products.cost_price: custo unitário do item, usado só para projetar o
--   lucro bruto acumulado (preco_venda - custo_unitario). Editável só por
--   admin, junto com o preço de venda.
-- - expense_outflows: lançamentos de saída de caixa (retiradas/alocações de
--   verba), com prestação de contas pública (data/hora, valor, destino,
--   responsável pela retirada e quem homologou o lançamento).
-- - Saldo em caixa real = total de pagamentos aprovados - total de saídas
--   registradas (independe do saldo devedor individual dos usuários, que é
--   outro razão — ver get_spending_ranking / compute_user_balance).
-- ============================================================================

-- ---- Papel 'ordenador_despesa' ----

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'ordenador_despesa'));

create or replace function public.is_expense_orderer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'ordenador_despesa') and is_active = true
  );
$$;

-- ---- Custo unitário do produto ----

alter table products add column cost_price numeric(10,2) not null default 0 check (cost_price >= 0);

-- ---- Saídas de caixa (prestação de contas) ----

create table expense_outflows (
  id uuid primary key default gen_random_uuid(),
  valor numeric(10,2) not null check (valor > 0),
  data_hora timestamptz not null default now(),
  local_destinado text not null,
  responsavel_retirada text not null,
  criado_por_id uuid not null references profiles(id),
  observacoes text,
  created_at timestamptz not null default now()
);

create index idx_expense_outflows_data_hora on expense_outflows(data_hora desc);
create index idx_expense_outflows_criado_por on expense_outflows(criado_por_id);

alter table expense_outflows enable row level security;

-- Qualquer usuário ativo pode ver o extrato de prestação de contas.
create policy "expense_outflows_select_active_users" on expense_outflows for select
  using (public.is_active_user());
-- Escrita direta só por admin/ordenador de despesa (defesa em profundidade —
-- o caminho normal é a função create_expense_outflow, abaixo).
create policy "expense_outflows_write_expense_orderer" on expense_outflows for all
  using (public.is_expense_orderer()) with check (public.is_expense_orderer());

-- ---- Resumo do caixa (público para qualquer usuário ativo) ----

create or replace function public.get_transparency_summary()
returns table(
  total_collected numeric,
  total_outflows numeric,
  available_balance numeric,
  estimated_profit numeric
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
      profit.total
    from
      (select coalesce(sum(admin_typed_amount), 0)::numeric as total from payments where status = 'approved') collected,
      (select coalesce(sum(valor), 0)::numeric as total from expense_outflows) outflows,
      (
        select coalesce(sum((w.unit_price_at_withdrawal - coalesce(p.cost_price, 0)) * w.quantity), 0)::numeric as total
        from withdrawals w
        join products p on p.id = w.product_id
        where w.status <> 'cancelled'
      ) profit;
end;
$$;

-- ---- Lançamento de saída de caixa ----
-- Valida o papel e que o valor não ultrapasse o saldo em caixa disponível
-- no momento (recalculado dentro da própria transação, contra corrida entre
-- lançamentos concorrentes).

create or replace function public.create_expense_outflow(
  p_valor numeric,
  p_local_destinado text,
  p_responsavel_retirada text,
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

  select
    coalesce((select sum(admin_typed_amount) from payments where status = 'approved'), 0)
    - coalesce((select sum(valor) from expense_outflows), 0)
  into v_available;

  if p_valor > v_available then
    raise exception 'Valor maior que o saldo em caixa disponível (R$ %)', to_char(v_available, 'FM999999990.00');
  end if;

  insert into expense_outflows (valor, local_destinado, responsavel_retirada, criado_por_id, observacoes)
  values (p_valor, btrim(p_local_destinado), btrim(p_responsavel_retirada), auth.uid(), nullif(btrim(coalesce(p_observacoes, '')), ''))
  returning * into v_row;

  perform public.log_action(null, 'expense_created', jsonb_build_object(
    'expense_id', v_row.id,
    'valor', p_valor,
    'local_destinado', v_row.local_destinado,
    'responsavel_retirada', v_row.responsavel_retirada
  ));

  return v_row;
end;
$$;
