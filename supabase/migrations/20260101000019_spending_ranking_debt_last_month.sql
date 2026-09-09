-- ============================================================================
-- Troca os filtros do ranking do dashboard: "Mês" (mês corrente, parcial)
-- vira "Mês passado" (mês fechado anterior), e entra "Saldo devedor"
-- (ranking por saldo em aberto, mesma fórmula do get_my_balance:
-- SUM(retiradas ativas) - SUM(pagamentos aprovados)) no lugar. "Ano" e
-- "Total" continuam iguais.
-- ============================================================================

create or replace function public.get_spending_ranking(p_period text default 'all')
returns table(user_id uuid, full_name text, total_spent numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'Não autorizado';
  end if;

  if p_period not in ('debt', 'last_month', 'year', 'all') then
    raise exception 'Período inválido';
  end if;

  if p_period = 'debt' then
    return query
      select
        p.id,
        p.full_name,
        greatest(0, coalesce(w.total_consumed, 0) - coalesce(pay.total_paid, 0))::numeric
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
      where p.is_active = true
        and greatest(0, coalesce(w.total_consumed, 0) - coalesce(pay.total_paid, 0)) > 0
      order by 3 desc, p.full_name asc;
    return;
  end if;

  return query
    select p.id, p.full_name, coalesce(sum(w.unit_price_at_withdrawal * w.quantity), 0)::numeric
    from profiles p
    left join withdrawals w on w.user_id = p.id
      and w.status <> 'cancelled'
      and (
        p_period = 'all'
        or (
          p_period = 'last_month'
          and w.created_at >= ((date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '1 month') at time zone 'America/Sao_Paulo')
          and w.created_at < (date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')
        )
        or (p_period = 'year' and w.created_at >= (date_trunc('year', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'))
      )
    where p.is_active = true
    group by p.id, p.full_name
    having coalesce(sum(w.unit_price_at_withdrawal * w.quantity), 0) > 0
    order by 3 desc, p.full_name asc;
end;
$$;
