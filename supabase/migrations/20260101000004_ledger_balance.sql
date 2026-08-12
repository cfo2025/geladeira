-- ============================================================================
-- Correção do cálculo de saldo devedor: passa a ser um razão (ledger) puro
-- em vez de depender de "travar" retiradas a um pagamento específico.
--
--   Saldo Devedor = SUM(retiradas ativas) - SUM(pagamentos aprovados)
--
-- Isso corrige o bug em que um pagamento PARCIAL aprovado zerava o saldo
-- inteiro (porque todas as retiradas vinculadas ficavam marcadas como
-- "pagas" independente do valor conferido pelo admin).
-- ============================================================================

-- Saldo de um usuário específico. Security definer com checagem de
-- autorização própria: só o próprio usuário ou um admin pode consultar.
create or replace function public.compute_user_balance(p_user_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Não autorizado';
  end if;

  return greatest(0,
    coalesce(
      (select sum(unit_price_at_withdrawal * quantity)
       from withdrawals
       where user_id = p_user_id and status <> 'cancelled'),
      0
    )
    - coalesce(
      (select sum(admin_typed_amount)
       from payments
       where user_id = p_user_id and status = 'approved'),
      0
    )
  );
end;
$$;

create or replace function public.get_my_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select public.compute_user_balance(auth.uid());
$$;

-- Soma do saldo em aberto de todos os usuários ativos (painel admin).
-- Cada saldo individual é truncado em zero antes de somar, para que o
-- eventual "crédito" de um usuário não abata a dívida de outro.
create or replace function public.get_total_open_balance()
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem consultar este total';
  end if;

  return coalesce((
    select sum(greatest(0, per_user.total_withdrawals - per_user.total_paid))
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
    ) per_user
  ), 0);
end;
$$;

-- declare_payment: o valor esperado passa a ser o saldo real (ledger),
-- e retiradas deixam de ser "travadas" a um pagamento — o saldo já é
-- recalculado puramente a partir de pagamentos aprovados.
create or replace function public.declare_payment(
  p_user_declared_amount numeric,
  p_is_partial boolean default false
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected numeric;
  v_payment payments%rowtype;
begin
  if not public.is_active_user() then
    raise exception 'Usuário inativo';
  end if;

  v_expected := public.compute_user_balance(auth.uid());

  if v_expected <= 0 then
    raise exception 'Não há saldo em aberto para declarar pagamento';
  end if;

  insert into payments (user_id, expected_amount, user_declared_amount, is_partial, status)
  values (auth.uid(), v_expected, p_user_declared_amount, p_is_partial, 'pending')
  returning * into v_payment;

  return v_payment;
end;
$$;

-- review_payment: como o saldo não depende mais de vínculo com retiradas,
-- não há nada para "desvincular" em caso de rejeição.
create or replace function public.review_payment(
  p_payment_id uuid,
  p_admin_typed_amount numeric,
  p_decision text,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem revisar pagamentos';
  end if;

  if p_decision not in ('approved', 'rejected_divergent', 'rejected_unpaid') then
    raise exception 'Decisão inválida';
  end if;

  select * into v_payment from payments where id = p_payment_id for update;
  if not found or v_payment.status <> 'pending' then
    raise exception 'Pagamento não encontrado ou já revisado';
  end if;

  update payments
    set status = p_decision,
        admin_typed_amount = p_admin_typed_amount,
        divergence_notes = p_notes,
        reviewed_at = now()
    where id = p_payment_id;

  if p_decision = 'approved' then
    perform public.notify(v_payment.user_id, 'Pagamento aprovado', 'Seu pagamento foi conferido e aprovado.');
  else
    perform public.notify(v_payment.user_id, 'Divergência no pagamento', 'Foi identificada uma divergência no seu pagamento. Acesse os detalhes para mais informações.');
  end if;

  perform public.log_action(v_payment.user_id, 'payment_reviewed', jsonb_build_object('payment_id', p_payment_id, 'decision', p_decision, 'admin_typed_amount', p_admin_typed_amount));
end;
$$;

-- request_withdrawal_cancellation: a elegibilidade não depende mais de
-- vínculo com pagamento — qualquer retirada concluída pode ser cancelada
-- (o razão recalcula o saldo puramente a partir do estado atual).
create or replace function public.request_withdrawal_cancellation(
  p_withdrawal_id uuid,
  p_reason text
)
returns withdrawal_cancellation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal withdrawals%rowtype;
  v_request withdrawal_cancellation_requests%rowtype;
begin
  select * into v_withdrawal from withdrawals where id = p_withdrawal_id;

  if not found or v_withdrawal.user_id <> auth.uid() then
    raise exception 'Retirada não encontrada';
  end if;

  if v_withdrawal.status <> 'completed' then
    raise exception 'Esta retirada não pode ser cancelada (status atual: %)', v_withdrawal.status;
  end if;

  update withdrawals set status = 'deletion_requested' where id = p_withdrawal_id;

  insert into withdrawal_cancellation_requests (withdrawal_id, user_id, reason)
  values (p_withdrawal_id, auth.uid(), p_reason)
  returning * into v_request;

  perform public.log_action(auth.uid(), 'cancellation_requested', jsonb_build_object('withdrawal_id', p_withdrawal_id));

  return v_request;
end;
$$;
