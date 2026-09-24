export type Cell = string | number | boolean | null | undefined;

/** Builds CSV text that opens cleanly in Excel. Text cells starting with = + - @ are quoted as text. */
export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

function cell(value: Cell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  let text = value;
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
