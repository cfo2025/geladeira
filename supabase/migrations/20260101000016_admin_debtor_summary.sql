-- ============================================================================
-- Resumo de devedores pro admin: saldo em aberto (mesmo razão do
-- compute_user_balance), último pagamento e sinalização de pagamento
-- pendente de aprovação — tudo num único RPC pra alimentar a nova aba
-- "Devedores" de /admin/pagamentos.
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
      greatest(0, coalesce(w.total_consumed, 0) - coalesce(pay.total_paid, 0))::numeric,
      lp.amount,
      lp.created_at,
      lp.status,
      coalesce(pend.has_pending, false)
    from profiles p
    left join lateral (
      select sum(unit_price_at_withdrawal * quantity) as total_consumed
      from withdrawals
      where user_id = p.id and status <> 'cancelled'
    ) w on true
    left join lateral (
      select sum(admin_typed_amount) as total_paid
      from payments
      where user_id = p.id and status = 'approved'
    ) pay on true
    left join lateral (
      select coalesce(admin_typed_amount, user_declared_amount) as amount, created_at, status
      from payments
      where user_id = p.id
      order by created_at desc
      limit 1
    ) lp on true
    left join lateral (
      select true as has_pending
      from payments
      where user_id = p.id and status = 'pending'
      limit 1
    ) pend on true
    where p.is_active = true
    order by 5 desc, p.full_name asc;
end;
$$;
