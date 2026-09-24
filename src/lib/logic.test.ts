import { describe, expect, it } from 'vitest';
import { moonPhase } from './moon';
import { countToRecords, rainByMonth, speciesSummary } from './records';
import { formatDay, formatShortDate } from './format';
import { SPECIES, matchesSearch, speciesForBirdnet, usuallyFlowering } from '../data/species';
import { birdnetWeek } from '../birdnet/protocol';
import { encodeWav, resample } from './wav';
import { parseForecast, weatherIcon, weatherWords } from './weather';
import { monthGuide } from '../data/seasons';
import type { FieldRecord } from '../db';
import { FARM_HA, PORTIONS, portionAt } from '../data/boundary';
import { FARM } from '../data/farm';

describe('moon phase', () => {
  it('knows a full moon', () => {
    expect(moonPhase(new Date(Date.UTC(2024, 0, 25, 18)))).toBe('Full moon');
  });
  it('knows a new moon', () => {
    expect(moonPhase(new Date(Date.UTC(2024, 0, 11, 12)))).toBe('New moon');
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

describe('bird sounds', () => {
  it('uses BirdNET weeks of the year, four per month', () => {
    expect(birdnetWeek(new Date(2026, 0, 1))).toBe(1);
    expect(birdnetWeek(new Date(2026, 8, 24))).toBe(35);
    expect(birdnetWeek(new Date(2026, 11, 31))).toBe(48);
  });
  it('writes a playable 16 bit WAV file', async () => {
    const wav = encodeWav(new Float32Array([0, 0.5, -1, 1]), 48_000);
    const bytes = new DataView(await wav.arrayBuffer());
    expect(wav.size).toBe(44 + 8);
    expect(String.fromCharCode(bytes.getUint8(0), bytes.getUint8(1), bytes.getUint8(2), bytes.getUint8(3))).toBe('RIFF');
    expect(bytes.getUint32(24, true)).toBe(48_000);
    expect(bytes.getInt16(48, true)).toBe(-32768);
    expect(bytes.getInt16(50, true)).toBe(32767);
  });
  it('resamples to the requested length', () => {
    const out = resample(new Float32Array([0, 1, 0, 1]), 44_100, 48_000, 5);
    expect(out.length).toBe(5);
    expect(out[0]).toBe(0);
  });
  it('maps BirdNET names to the species list, and adds new birds', () => {
    expect(speciesForBirdnet('Anthropoides paradiseus', 'Blue Crane', 'Bloukraanvoël').id).toBe('blue-crane');
    expect(speciesForBirdnet('Nectarinia famosa', 'Malachite Sunbird', 'Jangroentjie').id).toBe('malachite-sunbird');
    const added = speciesForBirdnet('Cisticola subruficapilla', 'Grey-backed Cisticola', 'Grysrugtinktinkie');
    expect(added).toMatchObject({ id: 'bn-cisticola-subruficapilla', group: 'birds' });
  });
});

describe('weather', () => {
  const entry = (time: string, temp: number, extra: object = {}) => ({ time, data: { instant: { details: { air_temperature: temp, wind_speed: 5 } }, ...extra } });
  it('reads the current weather and daily highs and lows from a MET forecast', () => {
    const f = parseForecast({
      properties: {
        timeseries: [
          entry('2026-09-24T08:00:00Z', 14.4, { next_1_hours: { summary: { symbol_code: 'partlycloudy_day' }, details: { precipitation_amount: 0.2 } }, next_6_hours: { summary: { symbol_code: 'rain' }, details: { precipitation_amount: 1.5 } } }),
          entry('2026-09-24T09:00:00Z', 18, { next_1_hours: { summary: { symbol_code: 'cloudy' }, details: { precipitation_amount: 0.3 } } }),
          entry('2026-09-24T10:00:00Z', 22.6, { next_1_hours: { summary: { symbol_code: 'clearsky_day' }, details: { precipitation_amount: 0 } } }),
        ],
      },
    }, 1000)!;
    expect(f.now).toEqual({ temp: 14, windKmh: 18, symbol: 'partlycloudy_day', rainNext6h: 1.5 });
    expect(f.days[0]).toMatchObject({ min: 14, max: 23, rain: 0.5 });
  });
  it('turns Yr symbol codes into words and icons', () => {
    expect(weatherWords('partlycloudy_day')).toBe('Partly cloudy');
    expect(weatherWords('lightrainshowers_night')).toBe('Light rain showers');
    expect(weatherWords('heavyrainandthunder')).toBe('Heavy rain and thunder');
    expect(weatherIcon('clearsky_night')).toBe('moon');
    expect(weatherIcon('rainshowersandthunder_day')).toBe('storm');
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

describe('farm boundary', () => {
  it('finds the portion a position is in', () => {
    expect(portionAt(FARM.centre[0], FARM.centre[1])?.name).toBe('Geelbosch Laagte');
    for (const p of PORTIONS) expect(portionAt(p.label[0], p.label[1])?.id).toBe(p.id);
  });

  it('leaves out the sold portion 54/80 and places outside the farm', () => {
    // Inside the sold portion 54 of Weltevreden, next to the label on the cadastral map.
    expect(portionAt(-33.510135, 21.419436)).toBeUndefined();
    expect(portionAt(-33.45, 21.3)).toBeUndefined();
  });

  it('adds up the registered areas', () => {
    expect(FARM_HA).toBe(3899);
  });
});
