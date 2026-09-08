// Utilitários pra garantir que "mês atual", "mês passado" etc. sejam sempre
// calculados no fuso de Brasília — independente de onde o código roda
// (o servidor da Vercel roda em UTC por padrão, não em America/Sao_Paulo).
// Brasília é UTC-3 fixo (sem horário de verão desde 2019).

export const BR_TIME_ZONE = "America/Sao_Paulo";
const BR_UTC_OFFSET_HOURS = 3;

/** Ano/mês/dia de uma data, lidos no fuso de Brasília (não no fuso local do processo). */
export function getBrasiliaDateParts(date: Date = new Date()): {
  year: number;
  month: number; // 0-indexado, como Date.getMonth()
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month) - 1, day: Number(map.day) };
}

/** Início do mês de `from` (ou de `monthsAgo` meses atrás), no fuso de Brasília, como instante UTC. */
export function startOfMonthBrasilia(monthsAgo = 0, from: Date = new Date()): Date {
  const { year, month } = getBrasiliaDateParts(from);
  return new Date(Date.UTC(year, month - monthsAgo, 1, BR_UTC_OFFSET_HOURS, 0, 0));
}

/** Início do ano de `from`, no fuso de Brasília, como instante UTC. */
export function startOfYearBrasilia(from: Date = new Date()): Date {
  const { year } = getBrasiliaDateParts(from);
  return new Date(Date.UTC(year, 0, 1, BR_UTC_OFFSET_HOURS, 0, 0));
}

/** Chave "ano-mês" (ex: "2026-8") de uma data, no fuso de Brasília — pra agrupar por mês corretamente. */
export function monthKeyBrasilia(date: Date): string {
  const { year, month } = getBrasiliaDateParts(date);
  return `${year}-${month}`;
}

/** "YYYY-MM-DD" de uma data no fuso de Brasília — pra comparar com o valor de um <input type="date">. */
export function dateInputValueBrasilia(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { year, month, day } = getBrasiliaDateParts(d);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
