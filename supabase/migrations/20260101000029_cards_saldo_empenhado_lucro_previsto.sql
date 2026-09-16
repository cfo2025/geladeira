-- ============================================================================
-- Reformula os cards de Transparência:
--
-- - Saldo em Caixa Disponível = Total recebido − total investido em
--   compras de produto − total gasto em despesas (todas as tags, inclusive
--   descaminho — é dinheiro que saiu do caixa de verdade). Antes, compra de
--   produto não abatia o saldo em caixa; agora abate, já que o admin pode
--   ter pago essas compras com o dinheiro arrecadado.
-- - Total Empenhado = soma das despesas com tag 'empenho' + 'bonus'
--   (patrocínio) — não inclui 'descaminho' (é perda/sumiço, não um
--   compromisso assumido) nem compras de produto. Visível pra todo mundo.
-- - Lucro Previsto = (Total recebido + Total a receber de todo mundo) −
--   total investido em compras − total gasto em despesas. Projeção do
--   resultado financeiro total contando com o que ainda vai entrar. Só
--   admin/ordenador de despesa vê (usa o saldo devedor de todo mundo, dado
--   sensível) — pra usuário comum esse campo vem null.
--
-- create_expense_outflow/update_expense_outflow validavam o valor contra
-- "saldo em caixa disponível" sem descontar compras — corrigido aqui pra
-- não ficar inconsistente com o novo card (o texto do erro cita esse saldo
-- diretamente, tem que bater com o que a tela mostra).
-- ============================================================================

drop function if exists public.get_transparency_summary();

create function public.get_transparency_summary()
returns table(
  available_balance numeric,
  total_empenhado numeric,
  projected_profit numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_collected numeric;
  v_purchases numeric;
  v_outflows numeric;
  v_empenhado numeric;
  v_a_receber numeric;
begin
  if not public.is_active_user() then
    raise exception 'Não autorizado';
  end if;

  select coalesce(sum(admin_typed_amount), 0) into v_collected from payments where status = 'approved';
  select coalesce(sum(unit_cost * quantity), 0) into v_purchases from product_purchases;
  select coalesce(sum(valor), 0) into v_outflows from expense_outflows;
  select coalesce(sum(valor), 0) into v_empenhado from expense_outflows where tag in ('empenho', 'bonus');

  if public.is_expense_orderer() then
    select coalesce(sum(greatest(0, per_user.total_withdrawals - per_user.total_paid)), 0) into v_a_receber
    from (
      select
        p.id,
        coalesce(
          (select sum(w.unit_price_at_withdrawal * w.quantity)
           from withdrawals w
           where w.user_id = p.id and w.status <> 'cancelled'),
          0
        ) as total_withdrawals,
        coalesce(
          (select sum(pay.admin_typed_amount)
           from payments pay
           where pay.user_id = p.id and pay.status = 'approved'),
          0
        ) as total_paid
      from profiles p
      where p.is_active = true
    ) per_user;
  else
    v_a_receber := null;
  end if;

  return query select
    v_collected - v_purchases - v_outflows,
    v_empenhado,
    case when v_a_receber is null then null else (v_collected + v_a_receber) - v_purchases - v_outflows end;
end;
$$;

create or replace function public.create_expense_outflow(
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
    - coalesce((select sum(unit_cost * quantity) from product_purchases), 0)
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

create or replace function public.update_expense_outflow(
  p_id uuid,
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
  v_old expense_outflows%rowtype;
  v_new expense_outflows%rowtype;
  v_available_without_this numeric;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem editar saídas de caixa';
  end if;

  select * into v_old from expense_outflows where id = p_id for update;
  if not found then
    raise exception 'Saída não encontrada';
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

  -- Saldo disponível "sem essa saída" (soma o valor antigo de volta antes
  -- de validar o novo valor, senão editar sempre pareceria estourar o
  -- saldo pelo valor que a própria saída já ocupava).
  select
    coalesce((select sum(admin_typed_amount) from payments where status = 'approved'), 0)
    - coalesce((select sum(unit_cost * quantity) from product_purchases), 0)
    - coalesce((select sum(valor) from expense_outflows where id <> p_id), 0)
  into v_available_without_this;

  if p_valor > v_available_without_this then
    raise exception 'Valor maior que o saldo em caixa disponível (R$ %)', to_char(v_available_without_this, 'FM999999990.00');
  end if;

  update expense_outflows
    set valor = p_valor,
        local_destinado = btrim(p_local_destinado),
        responsavel_retirada = btrim(p_responsavel_retirada),
        tag = p_tag,
        observacoes = nullif(btrim(coalesce(p_observacoes, '')), '')
    where id = p_id
    returning * into v_new;

  perform public.log_action(null, 'expense_updated', jsonb_build_object(
    'expense_id', p_id,
    'before', jsonb_build_object(
      'valor', v_old.valor,
      'local_destinado', v_old.local_destinado,
      'responsavel_retirada', v_old.responsavel_retirada,
      'tag', v_old.tag,
      'observacoes', v_old.observacoes
    ),
    'after', jsonb_build_object(
      'valor', v_new.valor,
      'local_destinado', v_new.local_destinado,
      'responsavel_retirada', v_new.responsavel_retirada,
      'tag', v_new.tag,
      'observacoes', v_new.observacoes
    )
  ));

  return v_new;
end;
$$;
