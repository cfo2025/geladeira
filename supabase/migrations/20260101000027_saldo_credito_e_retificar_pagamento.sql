-- ============================================================================
-- 1) get_admin_debtor_summary() deixa de travar o saldo em zero — agora
--    mostra o valor real (pode ser negativo = usuário pagou a mais e está
--    com crédito). O piso em zero continua existindo em compute_user_balance
--    (saldo que o próprio usuário vê) e em get_total_open_balance (soma só
--    do que está em aberto de verdade) — só a listagem do admin muda, pra
--    ele enxergar quem está devendo E quem está com saldo positivo.
--
-- 2) rectify_payment / remove_payment: admin corrige ou remove um pagamento
--    já revisado (aprovado por engano, valor errado, etc.), com motivo
--    obrigatório — gera log de auditoria dedicado ("retificação"), igual já
--    fizemos manualmente pro caso do Elias. remove_payment desvincula
--    quaisquer retiradas que ainda apontem pra esse pagamento (mesmo
--    tratamento que review_payment já dá numa rejeição) antes de apagar.
-- ============================================================================

create or replace function public.get_admin_debtor_summary()
returns table(
  user_id uuid,
  full_name text,
  total_consumed numeric,
  total_paid numeric,
  balance numeric,
  last_payment_amount numeric,
  last_payment_at timestamptz,
  last_payment_status text,
  has_pending_payment boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem consultar isso';
  end if;

  return query
    select
      p.id,
      p.full_name,
      coalesce(w.total_consumed, 0)::numeric,
      coalesce(pay.total_paid, 0)::numeric,
      (coalesce(w.total_consumed, 0) - coalesce(pay.total_paid, 0))::numeric,
      lp.amount,
      lp.created_at,
      lp.status,
      coalesce(pend.has_pending, false)
    from profiles p
    left join lateral (
      select sum(wd.unit_price_at_withdrawal * wd.quantity) as total_consumed
      from withdrawals wd
      where wd.user_id = p.id and wd.status <> 'cancelled'
    ) w on true
    left join lateral (
      select sum(pm.admin_typed_amount) as total_paid
      from payments pm
      where pm.user_id = p.id and pm.status = 'approved'
    ) pay on true
    left join lateral (
      select coalesce(pm.admin_typed_amount, pm.user_declared_amount) as amount, pm.created_at, pm.status
      from payments pm
      where pm.user_id = p.id
      order by pm.created_at desc
      limit 1
    ) lp on true
    left join lateral (
      select true as has_pending
      from payments pm
      where pm.user_id = p.id and pm.status = 'pending'
      limit 1
    ) pend on true
    where p.is_active = true
    order by 5 desc, p.full_name asc;
end;
$$;

create or replace function public.rectify_payment(
  p_payment_id uuid,
  p_admin_typed_amount numeric,
  p_notes text
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old payments%rowtype;
  v_new payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem retificar pagamentos';
  end if;

  if p_notes is null or btrim(p_notes) = '' then
    raise exception 'Informe o motivo da retificação';
  end if;

  select * into v_old from payments where id = p_payment_id for update;
  if not found then
    raise exception 'Pagamento não encontrado';
  end if;

  if v_old.status = 'pending' then
    raise exception 'Esse pagamento ainda não foi revisado — use a aprovação normal';
  end if;

  if p_admin_typed_amount is null or p_admin_typed_amount < 0 then
    raise exception 'Valor inválido';
  end if;

  update payments
    set admin_typed_amount = p_admin_typed_amount
    where id = p_payment_id
    returning * into v_new;

  perform public.log_action(v_old.user_id, 'payment_rectified', jsonb_build_object(
    'payment_id', p_payment_id,
    'before_amount', v_old.admin_typed_amount,
    'after_amount', v_new.admin_typed_amount,
    'notes', p_notes
  ));

  return v_new;
end;
$$;

create or replace function public.remove_payment(
  p_payment_id uuid,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem remover pagamentos';
  end if;

  if p_notes is null or btrim(p_notes) = '' then
    raise exception 'Informe o motivo da remoção';
  end if;

  select * into v_row from payments where id = p_payment_id for update;
  if not found then
    raise exception 'Pagamento não encontrado';
  end if;

  if v_row.status = 'pending' then
    raise exception 'Esse pagamento ainda não foi revisado — use a aprovação normal';
  end if;

  -- payment_id em withdrawals é legado (o saldo não depende mais disso),
  -- mas ainda existe em retiradas antigas — desvincula antes de apagar pra
  -- não esbarrar na foreign key.
  update withdrawals set payment_id = null where payment_id = p_payment_id;

  delete from payments where id = p_payment_id;

  perform public.log_action(v_row.user_id, 'payment_removed', jsonb_build_object(
    'payment_id', v_row.id,
    'user_declared_amount', v_row.user_declared_amount,
    'admin_typed_amount', v_row.admin_typed_amount,
    'status_before', v_row.status,
    'created_at', v_row.created_at,
    'notes', p_notes
  ));
end;
$$;
