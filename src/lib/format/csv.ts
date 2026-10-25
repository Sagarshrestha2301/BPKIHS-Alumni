/**
 * CSV building for admin exports.
 *
 * Two details matter more than the format itself:
 * - a value is quoted whenever it contains a comma, a quote or a newline, and inner quotes are
 *   doubled, so the file opens in a spreadsheet instead of falling apart;
 * - a cell that starts with a spreadsheet formula character is prefixed with an apostrophe, so
 *   a donor cannot smuggle a formula into the ledger through an anonymous name.
 */

const FORMULA_PREFIXES = new Set(['=', '+', '-', '@', '\t', '\r']);

function escapeCell(value: string): string {
  const guarded = FORMULA_PREFIXES.has(value.charAt(0)) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  // A trailing newline keeps the last row intact in every spreadsheet and CLI tool.
  return `${lines.join('\r\n')}\r\n`;
}
