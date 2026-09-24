import type { FieldRecord } from '../db';
import { getSpecies, GROUPS, type Group } from '../data/species';
import { formatTime } from './format';

export type RecordGroup = Group | 'rain';

export function recordGroup(r: FieldRecord): RecordGroup {
  if (r.kind === 'rain') return 'rain';
  return getSpecies(r.speciesId)?.group ?? (r.kind === 'plant' ? 'plants' : 'game');
}

export const RAIN_STYLE = { label: 'Rain', colour: '#466178', tint: '#DFE6EC', icon: 'drop' as const };

export function groupStyle(group: RecordGroup) {
  return group === 'rain' ? RAIN_STYLE : GROUPS[group];
}

export function recordTitle(r: FieldRecord): string {
  if (r.kind === 'rain') return 'Rain';
  return getSpecies(r.speciesId)?.en ?? 'Unknown';
}

/** The number shown on the right of a record: head count, rain or plant stage. */
export function recordValue(r: FieldRecord): string {
  if (r.kind === 'rain') return `${r.mm ?? 0} mm`;
  if (r.kind === 'plant') return r.stage ?? '';
  if (r.source === 'sound') return `${Math.round((r.confidence ?? 0) * 100)}%`;
  return String(r.n ?? 1);
}

export function recordMeta(r: FieldRecord): string {
  return [r.source === 'sound' ? 'Heard' : undefined, r.camp, r.by, formatTime(r.at)].filter(Boolean).join(' · ');
}

type CountBase = Omit<FieldRecord, 'id' | 'kind' | 'speciesId' | 'n' | 'sessionId' | 'updatedAt'>;

/** Turns the tallies of one Quick count into one record per species, all sharing a session id. */
export function countToRecords(
  counts: Record<string, number>,
  base: CountBase,
  makeId: () => string = () => crypto.randomUUID(),
): FieldRecord[] {
  const sessionId = makeId();
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([speciesId, n]) => ({
      ...base,
      id: makeId(),
      kind: 'animal' as const,
      speciesId,
      n,
      sessionId,
      updatedAt: base.at,
    }));
}

/** How often each species has been recorded, to put the usual ones first. */
export function usageBySpecies(records: FieldRecord[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const r of records) {
    if (r.speciesId) usage.set(r.speciesId, (usage.get(r.speciesId) ?? 0) + 1);
  }
  return usage;
}

export interface SpeciesSummary {
  records: number;
  animals: number;
  last?: FieldRecord;
  /** Records per calendar month, January first. */
  byMonth: number[];
  /** Months (1 to 12) in which the plant was recorded flowering. */
  floweringMonths: number[];
}

export function speciesSummary(records: FieldRecord[], speciesId: string): SpeciesSummary {
  const mine = records.filter((r) => r.speciesId === speciesId);
  const byMonth = Array<number>(12).fill(0);
  const flowering = new Set<number>();
  let animals = 0;
  let last: FieldRecord | undefined;
  for (const r of mine) {
    const month = new Date(r.at).getMonth();
    byMonth[month] += 1;
    if (r.kind === 'animal') animals += r.n ?? 1;
    if (r.kind === 'plant' && r.stage === 'Flowering') flowering.add(month + 1);
    if (!last || r.at > last.at) last = r;
  }
  return { records: mine.length, animals, last, byMonth, floweringMonths: [...flowering].sort((a, b) => a - b) };
}

export function isSameMonth(ts: number, year: number, month: number): boolean {
  const d = new Date(ts);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

/** Total rain per calendar month for a year, January first. */
export function rainByMonth(records: FieldRecord[], year: number): number[] {
  const totals = Array<number>(12).fill(0);
  for (const r of records) {
    const d = new Date(r.at);
    if (r.kind === 'rain' && d.getFullYear() === year) totals[d.getMonth()] += r.mm ?? 0;
  }
  return totals.map((t) => Math.round(t * 10) / 10);
}
