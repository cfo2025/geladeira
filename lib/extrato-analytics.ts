export type MonthlyPoint = { key: string; label: string; value: number };
export type LocationSlice = { id: string; name: string; value: number };

// Produtos com sabor/variante (ex: "Monster Ultra (Branco)", "Kit Kat Dark",
// "Juninho - Guaraná Coroa") são agrupados numa família única pra estatística
// de "item mais consumido" fazer sentido (senão cada sabor concorre separado).
const PRODUCT_FAMILIES = [
  "Monster",
  "Kit Kat",
  "Bis Extra",
  "Gatorade",
  "Powerade",
  "Red Bull",
  "Snickers",
  "Whey Pro",
  "Juninho",
  "Toddynho",
];

export function productFamily(name: string): string {
  const clean = name.replace(/\s*\(genérico\s*—\s*histórico\)\s*$/i, "").trim();
  const family = PRODUCT_FAMILIES.find((f) => clean.toLowerCase().startsWith(f.toLowerCase()));
  return family ?? clean;
}

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

export type ComparativeStats = {
  spentThisMonth: number;
  spentLastMonth: number;
  variationPct: number | null; // null quando não dá pra calcular (mês passado = 0)
  topItem: { name: string; category: string | null; quantity: number } | null;
  itemsCountThisMonth: number;
  topLocation: { name: string; quantity: number } | null;
};

export function buildComparativeStats(
  withdrawals: (WithdrawalLike & {
    product: { name: string; category: string | null } | null;
    location: { name: string } | null;
  })[]
): ComparativeStats {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let spentThisMonth = 0;
  let spentLastMonth = 0;
  let itemsCountThisMonth = 0;
  const familyTotals = new Map<string, { category: string | null; quantity: number }>();
  const locationTotals = new Map<string, number>();

  for (const w of withdrawals) {
    const createdAt = new Date(w.created_at);
    const amount = w.unit_price_at_withdrawal * w.quantity;

    if (createdAt >= startOfThisMonth) {
      spentThisMonth += amount;
      itemsCountThisMonth += w.quantity;

      if (w.product) {
        const family = productFamily(w.product.name);
        const existing = familyTotals.get(family);
        if (existing) existing.quantity += w.quantity;
        else familyTotals.set(family, { category: w.product.category, quantity: w.quantity });
      }
      if (w.location) {
        locationTotals.set(w.location.name, (locationTotals.get(w.location.name) ?? 0) + w.quantity);
      }
    } else if (createdAt >= startOfLastMonth && createdAt < startOfThisMonth) {
      spentLastMonth += amount;
    }
  }

  const variationPct =
    spentLastMonth > 0 ? ((spentThisMonth - spentLastMonth) / spentLastMonth) * 100 : null;

  const topItemEntry = [...familyTotals.entries()].sort((a, b) => b[1].quantity - a[1].quantity)[0];
  const topItem = topItemEntry
    ? { name: topItemEntry[0], category: topItemEntry[1].category, quantity: topItemEntry[1].quantity }
    : null;

  const topLocationEntry = [...locationTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topLocation = topLocationEntry ? { name: topLocationEntry[0], quantity: topLocationEntry[1] } : null;

  return { spentThisMonth, spentLastMonth, variationPct, topItem, itemsCountThisMonth, topLocation };
}
