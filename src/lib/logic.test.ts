import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';
import { moonPhase } from './moon';
import { countToRecords, rainByMonth, speciesSummary } from './records';
import { formatDay, formatShortDate } from './format';
import { SPECIES, matchesSearch, usuallyFlowering } from '../data/species';
import { monthGuide } from '../data/seasons';
import type { FieldRecord } from '../db';

describe('moon phase', () => {
  it('knows a full moon', () => {
    expect(moonPhase(new Date(Date.UTC(2024, 0, 25, 18)))).toBe('Full moon');
  });
  it('knows a new moon', () => {
    expect(moonPhase(new Date(Date.UTC(2024, 0, 11, 12)))).toBe('New moon');
  });
});

describe('csv', () => {
  it('quotes commas, quotes and new lines', () => {
    expect(toCsv([['a,b', 'say "hi"', 'two\nlines']])).toBe('"a,b","say ""hi""","two\nlines"');
  });
  it('stops text being read as a formula but leaves numbers alone', () => {
    expect(toCsv([['=SUM(A1)', -33.54, undefined]])).toBe("'=SUM(A1),-33.54,");
  });
});

describe('quick count', () => {
  it('makes one record per counted species, sharing a session', () => {
    let n = 0;
    const records = countToRecords({ kudu: 6, 'red-hartebeest': 7, klipspringer: 0 }, { at: 1000, by: 'Toppie', camp: 'Kamp 4' }, () => `id${n++}`);
    expect(records.map((r) => [r.speciesId, r.n])).toEqual([
      ['red-hartebeest', 7],
      ['kudu', 6],
    ]);
    expect(new Set(records.map((r) => r.sessionId)).size).toBe(1);
    expect(records.every((r) => r.kind === 'animal' && r.by === 'Toppie' && r.camp === 'Kamp 4' && r.updatedAt === 1000)).toBe(true);
    expect(new Set(records.map((r) => r.id)).size).toBe(2);
  });
});

describe('summaries', () => {
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9).getTime();
  const rec = (partial: Partial<FieldRecord>): FieldRecord => ({ id: String(Math.random()), kind: 'animal', at: 0, by: 'x', updatedAt: 0, ...partial });

  it('adds up rain per month for one year', () => {
    const records = [rec({ kind: 'rain', mm: 6, at: at(2026, 9, 3) }), rec({ kind: 'rain', mm: 8.5, at: at(2026, 9, 20) }), rec({ kind: 'rain', mm: 30, at: at(2025, 9, 1) })];
    const totals = rainByMonth(records, 2026);
    expect(totals[8]).toBe(14.5);
    expect(totals.reduce((a, b) => a + b, 0)).toBe(14.5);
  });

  it('summarises a species, including the months it was seen flowering', () => {
    const records = [
      rec({ kind: 'plant', speciesId: 'karoo-gold', stage: 'Flowering', at: at(2026, 9, 1) }),
      rec({ kind: 'plant', speciesId: 'karoo-gold', stage: 'Buds', at: at(2026, 8, 20) }),
      rec({ kind: 'animal', speciesId: 'kudu', n: 6, at: at(2026, 9, 2) }),
    ];
    const gold = speciesSummary(records, 'karoo-gold');
    expect(gold.records).toBe(2);
    expect(gold.floweringMonths).toEqual([9]);
    expect(gold.last?.at).toBe(at(2026, 9, 1));
    expect(speciesSummary(records, 'kudu').animals).toBe(6);
  });
});

describe('species list', () => {
  it('has unique ids and both names for every species', () => {
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
    expect(SPECIES.every((s) => s.en && s.af)).toBe(true);
  });
  it('finds species by Afrikaans name without accents', () => {
    const crane = SPECIES.find((s) => s.id === 'blue-crane')!;
    expect(matchesSearch(crane, 'bloukraanvoel')).toBe(true);
    expect(matchesSearch(crane, 'kudu')).toBe(false);
  });
  it('knows what usually flowers in September', () => {
    expect(usuallyFlowering(9).map((s) => s.id)).toEqual(expect.arrayContaining(['karoo-gold', 'vygies', 'botterblom']));
    expect(monthGuide(9).season).toBe('Spring');
  });
});

describe('dates', () => {
  it('says Today and Yesterday', () => {
    const now = new Date(2026, 8, 24, 12).getTime();
    expect(formatDay(new Date(2026, 8, 24, 7, 40).getTime(), now)).toBe('Today');
    expect(formatDay(new Date(2026, 8, 23, 18).getTime(), now)).toBe('Yesterday');
    expect(formatShortDate(new Date(2025, 9, 3).getTime(), now)).toBe('3 Oct 2025');
  });
});
