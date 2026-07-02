export function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatAmount(value: number, locale: string = "en"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundAmount(value));
}

export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return roundAmount(n);
}
