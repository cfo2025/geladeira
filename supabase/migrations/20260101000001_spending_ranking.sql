-- ============================================================================
-- Ranking de gastos: função para o Dashboard exibir o total gasto por cada
-- usuário ativo, sem expor o detalhe de cada retirada aos demais.
-- ============================================================================

create or replace function public.get_spending_ranking()
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

  return query
    select p.id, p.full_name, coalesce(sum(w.unit_price_at_withdrawal * w.quantity), 0)::numeric
    from profiles p
    left join withdrawals w on w.user_id = p.id and w.status <> 'cancelled'
    where p.is_active = true
    group by p.id, p.full_name
    order by 3 desc, p.full_name asc;
end;
$$;
