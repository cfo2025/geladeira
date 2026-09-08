// O saldo devedor do sistema é um razão puro (ver
// supabase/migrations/20260101000004_ledger_balance.sql):
//
//   saldo = max(0, SUM(retiradas ativas) - SUM(pagamentos aprovados))
//
// Não há vínculo entre uma retirada específica e um pagamento específico
// (a coluna withdrawals.payment_id é legado, não é mais escrita pelo app).
// Pra saber "quanto do consumo deste mês já foi pago", assumimos que cada
// pagamento quita sempre a dívida mais antiga primeiro (efeito cascata) —
// é só uma forma de exibição, não altera nada no banco.

export function allocateMonthlyBalance(
  spentBeforeMonth: number,
  spentThisMonth: number,
  totalPaidAllTime: number
): { paidThisMonth: number; openThisMonth: number; openBeforeMonth: number } {
  const poolLeftForThisMonth = Math.max(0, totalPaidAllTime - spentBeforeMonth);
  const paidThisMonth = Math.min(spentThisMonth, poolLeftForThisMonth);
  const openThisMonth = spentThisMonth - paidThisMonth;
  const openBeforeMonth = Math.max(0, spentBeforeMonth - Math.min(totalPaidAllTime, spentBeforeMonth));
  return { paidThisMonth, openThisMonth, openBeforeMonth };
}
