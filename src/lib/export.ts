import { db, type FieldRecord } from '../db';
import { getSpecies } from '../data/species';
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
    'rain_mm', 'camp', 'latitude', 'longitude', 'accuracy_m', 'recorded_by', 'moon', 'note',
  ];
  const rows = [...records]
    .sort((a, b) => a.at - b.at)
    .map((r) => {
      const s = getSpecies(r.speciesId);
      return [
        toDateInput(r.at), formatTime(r.at), r.kind, s?.en, s?.af, s?.sci, r.n, r.stage, r.amount, r.colour,
        r.mm, r.camp, r.lat, r.lng, r.acc, r.by, r.moon, r.note,
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

/** Everything on this device, photos included, as one JSON file. */
export async function exportBackup(): Promise<Blob> {
  const [records, photos, settings] = await Promise.all([db.records.toArray(), db.photos.toArray(), db.settings.toArray()]);
  const photoData = await Promise.all(photos.map(async (p) => ({ id: p.id, at: p.at, data: await blobToDataUrl(p.blob) })));
  const backup = {
    app: 'veldboek',
    format: 1,
    exportedAt: new Date().toISOString(),
    records,
    photos: photoData,
    settings: settings.filter((s) => SHARED_SETTINGS.includes(s.key)),
  };
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

const KINDS = new Set(['animal', 'plant', 'rain']);

function isRecord(value: unknown): value is FieldRecord {
  const r = value as FieldRecord;
  return typeof r?.id === 'string' && KINDS.has(r.kind) && typeof r.at === 'number' && typeof r.updatedAt === 'number';
}

/** Adds the records and photos from a backup file. Records already here are only replaced by newer versions. */
export async function importBackup(file: File): Promise<{ records: number; photos: number }> {
  let data: { app?: string; records?: unknown[]; photos?: { id: string; at: number; data: string }[]; settings?: { key: string; value: unknown }[] };
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('This file is not a Veldboek backup');
  }
  if (data?.app !== 'veldboek' || !Array.isArray(data.records)) throw new Error('This file is not a Veldboek backup');

  const incoming = data.records.filter(isRecord);
  const existing = new Map((await db.records.toArray()).map((r) => [r.id, r]));
  const records = incoming.filter((r) => (existing.get(r.id)?.updatedAt ?? -1) < r.updatedAt);

  const photos = await Promise.all(
    (data.photos ?? [])
      .filter((p) => typeof p?.id === 'string' && typeof p.data === 'string' && p.data.startsWith('data:image/'))
      .map(async (p) => ({ id: p.id, at: p.at, blob: await (await fetch(p.data)).blob() })),
  );

  const settings = (data.settings ?? []).filter((s) => SHARED_SETTINGS.includes(s?.key) && Array.isArray(s.value));

  await db.transaction('rw', db.records, db.photos, db.settings, async () => {
    await db.records.bulkPut(records);
    await db.photos.bulkPut(photos);
    for (const s of settings) {
      const current = ((await db.settings.get(s.key))?.value as string[] | undefined) ?? [];
      const merged = [...new Set([...current, ...(s.value as unknown[]).filter((v): v is string => typeof v === 'string')])];
      await db.settings.put({ key: s.key, value: merged });
    }
  });
  return { records: records.length, photos: photos.length };
}
