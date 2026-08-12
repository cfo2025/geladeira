export type MonthlyPoint = { key: string; label: string; value: number };
export type LocationSlice = { id: string; name: string; value: number };

type WithdrawalLike = {
  created_at: string;
  unit_price_at_withdrawal: number;
  quantity: number;
};

export function buildMonthlyHistory(withdrawals: WithdrawalLike[], months = 6): MonthlyPoint[] {
  const now = new Date();
  const buckets: MonthlyPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    buckets.push({ key, label, value: 0 });
  }

  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const w of withdrawals) {
    const d = new Date(w.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.value += w.unit_price_at_withdrawal * w.quantity;
  }

  return buckets;
}

export function buildLocationDistribution(
  withdrawals: (WithdrawalLike & { location: { id: string; name: string } | null })[],
  maxSlices = 3
): LocationSlice[] {
  const totals = new Map<string, LocationSlice>();

  for (const w of withdrawals) {
    if (!w.location) continue;
    const amount = w.unit_price_at_withdrawal * w.quantity;
    const existing = totals.get(w.location.id);
    if (existing) existing.value += amount;
    else totals.set(w.location.id, { id: w.location.id, name: w.location.name, value: amount });
  }

  const sorted = [...totals.values()].sort((a, b) => b.value - a.value);
  if (sorted.length <= maxSlices) return sorted;

  const top = sorted.slice(0, maxSlices - 1);
  const restValue = sorted.slice(maxSlices - 1).reduce((sum, s) => sum + s.value, 0);
  return [...top, { id: "outros", name: "Outros", value: restValue }];
}
