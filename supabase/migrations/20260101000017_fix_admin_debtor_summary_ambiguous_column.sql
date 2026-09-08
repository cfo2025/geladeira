-- ============================================================================
-- Corrige "column reference user_id is ambiguous": o parâmetro de retorno
-- da função se chama user_id, e o Postgres não sabia se era a variável
-- PL/pgSQL ou a coluna de withdrawals/payments dentro das subqueries
-- laterais. Qualifica todas as colunas com o nome da tabela.
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
