/** Money is stored as integer minor units (paisa). NPR only (decision D30). */

const grouping = new Intl.NumberFormat('en-US');

function assertFinite(minor: number): void {
  if (!Number.isFinite(minor)) throw new RangeError(`Invalid amount: ${minor}`);
}

/** NPR 5,000 · NPR 1,250.50 · NPR 0.05 (paisa are shown only when non-zero). */
export function formatNpr(minor: number): string {
  assertFinite(minor);
  const sign = minor < 0 ? '-' : '';
  const total = Math.round(Math.abs(minor));
  const rupees = Math.trunc(total / 100);
  const paisa = total % 100;
  const fraction = paisa === 0 ? '' : `.${String(paisa).padStart(2, '0')}`;
  return `${sign}NPR ${grouping.format(rupees)}${fraction}`;
}

function oneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Short form for stat bands: NPR 99,999 · NPR 420K · NPR 4.2M · NPR 1.5B.
 * Below NPR 100,000 the exact whole-rupee amount is shown.
 */
export function formatNprCompact(minor: number): string {
  assertFinite(minor);
  const sign = minor < 0 ? '-' : '';
  const rupees = Math.round(Math.abs(minor) / 100);

  if (rupees >= 1e9) return `${sign}NPR ${oneDecimal(rupees / 1e9)}B`;
  if (rupees >= 1e6) {
    const millions = Math.round((rupees / 1e6) * 10) / 10;
    if (millions >= 1000) return `${sign}NPR 1B`;
    return `${sign}NPR ${oneDecimal(millions)}M`;
  }
  if (rupees >= 1e5) {
    const thousands = Math.round((rupees / 1e3) * 10) / 10;
    if (thousands >= 1000) return `${sign}NPR 1M`;
    return `${sign}NPR ${oneDecimal(thousands)}K`;
  }
  return `${sign}NPR ${grouping.format(rupees)}`;
}

/** Whole rupees to paisa, for tests and seed data: rupees(5000) is 500000. */
export function rupees(amount: number): number {
  return Math.round(amount * 100);
}
