-- ============================================================================
-- Ordenador de despesa deveria ver os dados de TODO MUNDO em Pagamentos e
-- Retiradas (igual admin), só sem poder aprovar/editar nada — a UI já
-- esconde os botões de ação, mas o RLS ainda restringia várias tabelas a
-- "próprio usuário ou admin" (só payments tinha sido liberado, na migration
-- 20260101000024). Na prática ele só via os retiradas/cancelamentos dele
-- mesmo, e os nomes de outros usuários apareciam em branco nos joins com
-- profiles.
-- ============================================================================

drop policy if exists "withdrawals_select_own_or_admin" on withdrawals;
drop policy if exists "withdrawals_select_own_or_expense_orderer" on withdrawals;
create policy "withdrawals_select_own_or_expense_orderer" on withdrawals for select
  using (user_id = auth.uid() or public.is_expense_orderer());

drop policy if exists "cancellation_requests_select_own_or_admin" on withdrawal_cancellation_requests;
drop policy if exists "cancellation_requests_select_own_or_expense_orderer" on withdrawal_cancellation_requests;
create policy "cancellation_requests_select_own_or_expense_orderer" on withdrawal_cancellation_requests for select
  using (user_id = auth.uid() or public.is_expense_orderer());

-- profiles: os joins de nome (withdrawals/pagamentos/cancelamentos ->
-- profiles!...(full_name)) respeitam RLS da tabela referenciada — sem isso,
-- o nome de qualquer usuário que não fosse o próprio ordenador vinha nulo.
drop policy if exists "profiles_select_own_or_admin" on profiles;
drop policy if exists "profiles_select_own_or_expense_orderer" on profiles;
create policy "profiles_select_own_or_expense_orderer" on profiles for select
  using (id = auth.uid() or public.is_expense_orderer());
-- Escrita continua exclusiva de admin (política de update já existente,
-- não mexida aqui).

-- stock_audits/stock_audit_items: aparecem na mesma tela (Retiradas ->
-- Divergências de balanço). Libera leitura pro ordenador, escrita continua
-- só admin (era uma política "for all" só; precisa separar por operação).
drop policy if exists "stock_audits_admin_only" on stock_audits;
create policy "stock_audits_select_expense_orderer" on stock_audits for select
  using (public.is_expense_orderer());
create policy "stock_audits_admin_insert" on stock_audits for insert
  with check (public.is_admin());
create policy "stock_audits_admin_update" on stock_audits for update
  using (public.is_admin()) with check (public.is_admin());
create policy "stock_audits_admin_delete" on stock_audits for delete
  using (public.is_admin());

drop policy if exists "stock_audit_items_admin_only" on stock_audit_items;
create policy "stock_audit_items_select_expense_orderer" on stock_audit_items for select
  using (public.is_expense_orderer());
create policy "stock_audit_items_admin_insert" on stock_audit_items for insert
  with check (public.is_admin());
create policy "stock_audit_items_admin_update" on stock_audit_items for update
  using (public.is_admin()) with check (public.is_admin());
create policy "stock_audit_items_admin_delete" on stock_audit_items for delete
  using (public.is_admin());
