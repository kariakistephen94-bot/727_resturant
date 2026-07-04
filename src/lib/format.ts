const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Nigerian Naira display, e.g. ₦4,500.00 */
export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount);
}

/** Plain number with thousands separators, e.g. 4,500 */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

/** Naira without decimals for compact UI */
export function formatNairaCompact(amount: number): string {
  return `₦${formatNumber(amount)}`;
}

function trimDecimal(value: number, places: number): string {
  const factor = 10 ** places;
  return (Math.round(value * factor) / factor).toString();
}

/**
 * Abbreviates large numbers so they never blow out tight UI (dashboard cards).
 * e.g. 950 → "950", 125400 → "125K", 1250000 → "1.3M", 100000000 → "100M", 1.2e9 → "1.2B"
 */
export function compactNumber(amount: number): string {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  // Thresholds are set just below each boundary so rounding carries cleanly
  // (e.g. 999,999 → "1M" instead of "1000K").
  if (abs >= 999_500_000) return `${sign}${trimDecimal(abs / 1_000_000_000, 1)}B`;
  if (abs >= 999_500) return `${sign}${trimDecimal(abs / 1_000_000, 1)}M`;
  if (abs >= 100_000) return `${sign}${Math.round(abs / 1_000)}K`;
  return formatNumber(Math.round(n));
}

/** Compact Naira for dashboard KPIs, e.g. ₦100M, ₦1.2M, ₦125K, ₦4,500 */
export function formatNairaShort(amount: number): string {
  return `₦${compactNumber(amount)}`;
}
