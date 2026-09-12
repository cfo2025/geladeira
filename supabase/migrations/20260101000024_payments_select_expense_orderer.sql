-- ============================================================================
-- Ordenador de despesa também precisa ler todos os pagamentos aprovados pra
-- montar o extrato combinado (entradas + saídas) em Transparência — antes
-- só admin (via is_admin()) conseguia ver pagamentos de outros usuários.
-- ============================================================================

drop policy if exists "payments_select_own_or_admin" on payments;
drop policy if exists "payments_select_own_or_expense_orderer" on payments;
create policy "payments_select_own_or_expense_orderer" on payments for select
  using (user_id = auth.uid() or public.is_expense_orderer());
