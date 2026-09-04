-- ============================================================================
-- Ranking de gastos passa a aceitar um período: 'month' (mês corrente),
-- 'year' (ano corrente) ou 'all' (histórico completo, comportamento
-- anterior — segue sendo o padrão do parâmetro).
-- ============================================================================

-- remove a assinatura antiga (sem parâmetro) — sem isso, o Postgres passaria
-- a ter duas versões da função sobrecarregadas (por número de argumentos).
drop function if exists public.get_spending_ranking();

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

  if p_period not in ('month', 'year', 'all') then
    raise exception 'Período inválido';
  end if;

  return query
    select p.id, p.full_name, coalesce(sum(w.unit_price_at_withdrawal * w.quantity), 0)::numeric
    from profiles p
    left join withdrawals w on w.user_id = p.id
      and w.status <> 'cancelled'
      and (
        p_period = 'all'
        or (p_period = 'month' and w.created_at >= date_trunc('month', now()))
        or (p_period = 'year' and w.created_at >= date_trunc('year', now()))
      )
    where p.is_active = true
    group by p.id, p.full_name
    having coalesce(sum(w.unit_price_at_withdrawal * w.quantity), 0) > 0
    order by 3 desc, p.full_name asc;
end;
$$;
