import { db, type FieldRecord, type PersonRow } from '../db';
import { getSpecies, type Species } from '../data/species';
import { toCsv } from './csv';
import { toDateInput, formatTime } from './format';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function recordsToCsv(records: FieldRecord[]): string {
  const header = [
    'date', 'time', 'kind', 'species', 'afrikaans', 'scientific', 'count', 'stage', 'amount', 'flower_colour',
    'rain_mm', 'camp', 'latitude', 'longitude', 'accuracy_m', 'recorded_by', 'moon', 'identified_by', 'confidence', 'note',
  ];
  const rows = [...records]
    .sort((a, b) => a.at - b.at)
    .map((r) => {
      const s = getSpecies(r.speciesId);
      return [
        toDateInput(r.at), formatTime(r.at), r.kind, s?.en, s?.af, s?.sci, r.n, r.stage, r.amount, r.colour,
        r.mm, r.camp, r.lat, r.lng, r.acc, r.by, r.moon, r.source === 'sound' ? 'BirdNET (sound)' : undefined, r.confidence, r.note,
      ];
    });
  return toCsv([header, ...rows]);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const SHARED_SETTINGS = ['camps', 'people'];

/** Everything on this device, photos and bird recordings included, as one JSON file. */
export async function exportBackup(): Promise<Blob> {
  const [records, photos, clips, species, settings] = await Promise.all([
    db.records.toArray(),
    db.photos.toArray(),
    db.clips.toArray(),
    db.species.toArray(),
    db.settings.toArray(),
  ]);
  const people = await db.people.toArray();
  const encode = (rows: { id: string; at: number; blob: Blob }[]) =>
    Promise.all(rows.map(async (p) => ({ id: p.id, at: p.at, data: await blobToDataUrl(p.blob) })));
  const backup = {
    app: 'veldboek',
    format: 1,
    exportedAt: new Date().toISOString(),
    records,
    photos: await encode(photos),
    clips: await encode(clips),
    species,
    people,
    settings: settings.filter((s) => SHARED_SETTINGS.includes(s.key)),
  };
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

const KINDS = new Set(['animal', 'plant', 'rain']);

function isRecord(value: unknown): value is FieldRecord {
  const r = value as FieldRecord;
  return typeof r?.id === 'string' && KINDS.has(r.kind) && typeof r.at === 'number' && typeof r.updatedAt === 'number';
}

const AVATAR = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/;

function isPerson(value: unknown): value is PersonRow {
  const p = value as PersonRow;
  return (
    typeof p?.name === 'string' &&
    p.name.trim().length > 0 &&
    p.name.length <= 40 &&
    (p.avatar === undefined || (typeof p.avatar === 'string' && p.avatar.length < 400_000 && AVATAR.test(p.avatar))) &&
    (p.colour === undefined || (typeof p.colour === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p.colour)))
  );
}

/**
 * Adds the records, photos and people from a backup or family file.
 * Records already here are only replaced by newer versions.
 */
export async function importBackup(file: File): Promise<{ records: number; photos: number; people: number }> {
  type Encoded = { id: string; at: number; data: string };
  let data: {
    app?: string;
    records?: unknown[];
    photos?: Encoded[];
    clips?: Encoded[];
    species?: Species[];
    people?: unknown[];
    settings?: { key: string; value: unknown }[];
  };
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('This file is not a Veldboek backup');
  }
  if (data?.app !== 'veldboek' || !Array.isArray(data.records)) throw new Error('This file is not a Veldboek backup');

  const incoming = data.records.filter(isRecord);
  const existing = new Map((await db.records.toArray()).map((r) => [r.id, r]));
  const records = incoming.filter((r) => (existing.get(r.id)?.updatedAt ?? -1) < r.updatedAt);

  const decode = (rows: Encoded[] | undefined, prefix: string) =>
    Promise.all(
      (rows ?? [])
        .filter((p) => typeof p?.id === 'string' && typeof p.data === 'string' && p.data.startsWith(prefix))
        .map(async (p) => ({ id: p.id, at: Number(p.at) || Date.now(), blob: await (await fetch(p.data)).blob() })),
    );
  const photos = await decode(data.photos, 'data:image/');
  const clips = await decode(data.clips, 'data:audio/');
  const species = (data.species ?? []).filter(
    (s) => typeof s?.id === 'string' && s.id.startsWith('bn-') && s.group === 'birds' && typeof s.en === 'string' && typeof s.af === 'string',
  );

  const people = (data.people ?? []).filter(isPerson).map((p) => ({ name: p.name.trim(), avatar: p.avatar, colour: p.colour }));
  const settings = (data.settings ?? []).filter((s) => SHARED_SETTINGS.includes(s?.key) && Array.isArray(s.value));
  if (people.length) settings.push({ key: 'people', value: people.map((p) => p.name) });

  await db.transaction('rw', [db.records, db.photos, db.clips, db.species, db.people, db.settings], async () => {
    await db.records.bulkPut(records);
    await db.photos.bulkPut(photos);
    await db.clips.bulkPut(clips);
    await db.species.bulkPut(species.map((s) => ({ id: s.id, group: 'birds' as const, en: s.en, af: s.af, sci: s.sci })));
    await db.people.bulkPut(people);
    for (const s of settings) {
      const current = ((await db.settings.get(s.key))?.value as string[] | undefined) ?? [];
      const merged = [...new Set([...current, ...(s.value as unknown[]).filter((v): v is string => typeof v === 'string')])];
      await db.settings.put({ key: s.key, value: merged });
    }
  });
  return { records: records.length, photos: photos.length, people: people.length };
}
