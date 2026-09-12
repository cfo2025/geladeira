-- ============================================================================
-- Volta a contar todo o histórico de pagamentos aprovados em "Total
-- arrecadado"/"Saldo em caixa disponível" (o corte de "zerar o caixa" da
-- migration 20260101000022 foi revertido — o admin decidiu que o valor
-- recebido de todo mundo deve somar de verdade, não só a partir de um
-- marco). O app_settings.cash_ledger_started_at fica no banco sem uso,
-- inofensivo, caso precise desse mecanismo de novo no futuro.
--
-- Lucro real também muda de fórmula: em vez de comparar preço de venda x
-- custo médio retirada por retirada, agora é simplesmente
--   Lucro real = Total arrecadado − Total gasto em compras de produto
-- (soma de product_purchases.quantity * unit_cost). "Lucro previsto" não
-- é mais um agregado da página — vira só uma prévia ao vivo no modal de
-- compra (calculada no client, não precisa de SQL).
-- ============================================================================

drop function if exists public.get_transparency_summary();

create function public.get_transparency_summary()
returns table(
  total_collected numeric,
  total_outflows numeric,
  available_balance numeric,
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
      collected.total - purchases.total
    from
      (select coalesce(sum(admin_typed_amount), 0)::numeric as total from payments where status = 'approved') collected,
      (select coalesce(sum(valor), 0)::numeric as total from expense_outflows) outflows,
      (select coalesce(sum(unit_cost * quantity), 0)::numeric as total from product_purchases) purchases;
end;
$$;
