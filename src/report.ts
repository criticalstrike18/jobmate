export interface ProbeRow {
  board: string;
  ok: boolean;
  count?: number;
  sample?: string;
  error?: string;
  ms: number;
}

export function formatProbe(rows: Array<{
  board: { id: string; label: string };
  ok: true;
  count: number;
  sample?: string;
  ms: number;
} | {
  board: { id: string; label: string };
  ok: false;
  error: string;
  ms: number;
}>): string {
  const width = Math.max(...rows.map((r) => r.board.label.length), 8);
  const lines: string[] = [];

  for (const row of rows) {
    const name = row.board.label.padEnd(width);
    if (row.ok) {
      lines.push(`  ok    ${name}  ${String(row.count).padStart(4)} jobs  ${row.ms}ms  ${row.sample ?? ''}`);
    } else {
      lines.push(`  FAIL  ${name}  ${row.ms}ms  ${row.error}`);
    }
  }

  const ok = rows.filter((r) => r.ok).length;
  lines.push(`\n  ${ok}/${rows.length} boards reachable`);
  return lines.join('\n');
}