-- ============================================================================
-- Zera "Saldo em caixa disponível" e "Total arrecadado" a partir de agora.
--
-- payments.approved já tinha meses de Pix confirmados de antes desse
-- módulo existir — esse dinheiro já foi usado informalmente (comprar
-- estoque, etc.) sem passar por aqui, então contar ele como "disponível"
-- hoje é enganoso. Só pagamentos aprovados A PARTIR de agora entram na
-- conta do caixa — o extrato/saldo devedor de cada usuário (get_my_balance,
-- ranking) continua sem alteração, é só a Transparência que muda.
--
-- app_settings guarda esse marco como um valor congelado (não dá pra usar
-- now() direto dentro da função — recalcularia a cada chamada e nunca
-- contaria nada). Serve de mecanismo reaproveitável se precisar "zerar de
-- novo" no futuro: basta atualizar essa linha.
-- ============================================================================

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

drop policy if exists "app_settings_select_active_users" on app_settings;
create policy "app_settings_select_active_users" on app_settings for select
  using (public.is_active_user());
-- Sem policy de escrita: só via SQL/service role mesmo — não é editável pelo app.

insert into app_settings (key, value)
values ('cash_ledger_started_at', to_jsonb(now()))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- CREATE OR REPLACE não troca o formato de retorno (colunas OUT) de uma
-- função existente — precisa apagar primeiro. Cobre o caso de a migration
-- anterior (20260101000021, que mudou de "estimated_profit" pra
-- "projected_profit"+"realized_profit") ainda não ter sido rodada.
drop function if exists public.get_transparency_summary();

create function public.get_transparency_summary()
returns table(
  total_collected numeric,
  total_outflows numeric,
  available_balance numeric,
  projected_profit numeric,
  realized_profit numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_started_at timestamptz;
begin
  if not public.is_active_user() then
    raise exception 'Não autorizado';
  end if;

  select (value #>> '{}')::timestamptz into v_started_at
  from app_settings
  where key = 'cash_ledger_started_at';

  return query
    select
      collected.total,
      outflows.total,
      collected.total - outflows.total,
      projected.total,
      realized.total
    from
      (
        select coalesce(sum(admin_typed_amount), 0)::numeric as total
        from payments
        where status = 'approved'
          and reviewed_at >= coalesce(v_started_at, '-infinity'::timestamptz)
      ) collected,
      (select coalesce(sum(valor), 0)::numeric as total from expense_outflows) outflows,
      (
        select coalesce(sum((coalesce(p.promo_price, p.price) - p.cost_price) * inv.quantity), 0)::numeric as total
        from inventory inv
        join products p on p.id = inv.product_id
        where p.cost_price > 0
      ) projected,
      (
        select coalesce(sum((w.unit_price_at_withdrawal - p.cost_price) * w.quantity), 0)::numeric as total
        from withdrawals w
        join products p on p.id = w.product_id
        where w.status <> 'cancelled' and p.cost_price > 0
      ) realized;
end;
$$;
