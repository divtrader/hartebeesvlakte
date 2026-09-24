import Dexie, { type EntityTable } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Species } from './data/species';

export type Kind = 'animal' | 'plant' | 'rain';

export const STAGES = ['Leaves only', 'Buds', 'Flowering', 'Seeding', 'Dormant'] as const;
export type Stage = (typeof STAGES)[number];

export const AMOUNTS = ['One', 'A few', 'Many', 'Carpet'] as const;
export type Amount = (typeof AMOUNTS)[number];

export interface FieldRecord {
  id: string;
  kind: Kind;
  /** When it was seen, epoch milliseconds. */
  at: number;
  /** Who recorded it. */
  by: string;
  camp?: string;
  lat?: number;
  lng?: number;
  /** GPS accuracy in metres. */
  acc?: number;
  speciesId?: string;
  /** Number of animals. */
  n?: number;
  /** Records saved together from one Quick count share a session. */
  sessionId?: string;
  stage?: Stage;
  amount?: Amount;
  colour?: string;
  photoPoint?: boolean;
  /** Rain in millimetres. */
  mm?: number;
  note?: string;
  photoIds?: string[];
  moon?: string;
  /** 'sound' when BirdNET identified the bird from its call. */
  source?: 'sound';
  /** BirdNET confidence, 0 to 1. */
  confidence?: number;
  /** The 3 second recording the identification was made from. */
  clipId?: string;
  updatedAt: number;
}

export interface PhotoRow {
  id: string;
  blob: Blob;
  at: number;
}

export type ClipRow = PhotoRow;

/** A family member or staff member, with their avatar from the private family file. */
export interface PersonRow {
  name: string;
  /** Round avatar image as a data URL. */
  avatar?: string;
  colour?: string;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

class VeldboekDB extends Dexie {
  records!: EntityTable<FieldRecord, 'id'>;
  photos!: EntityTable<PhotoRow, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;
  clips!: EntityTable<ClipRow, 'id'>;
  /** Species added from bird sound identification, beyond the starter list. */
  species!: EntityTable<Species, 'id'>;
  /** Avatars; never part of the public code, loaded from the family file. */
  people!: EntityTable<PersonRow, 'name'>;

  constructor() {
    super('veldboek');
    this.version(1).stores({
      records: 'id, kind, at, speciesId, sessionId, camp',
      photos: 'id, at',
      settings: 'key',
    });
    this.version(2).stores({
      clips: 'id, at',
      species: 'id',
    });
    this.version(3).stores({
      people: 'name',
    });
  }
}

export const db = new VeldboekDB();

export function uid(): string {
  return crypto.randomUUID();
}

export function useSetting<T>(key: string, fallback: T): T {
  const row = useLiveQuery(() => db.settings.get(key), [key]);
  return row === undefined ? fallback : (row.value as T);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

/** All records, newest first. Returns undefined while loading. */
export function useRecords(): FieldRecord[] | undefined {
  return useLiveQuery(() => db.records.orderBy('at').reverse().toArray(), []);
}

export async function saveRecords(records: FieldRecord[]): Promise<void> {
  await db.records.bulkPut(records);
  // Ask the browser not to clear the data when space runs low. Installed home screen apps get this anyway.
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Not supported; nothing to do.
  }
}

export async function deleteRecord(id: string): Promise<void> {
  await db.transaction('rw', db.records, db.photos, db.clips, async () => {
    const record = await db.records.get(id);
    await db.records.delete(id);
    if (record?.clipId) await db.clips.delete(record.clipId);
    if (!record?.photoIds?.length) return;
    // Photos can be shared by the records of one count; only delete those nothing else uses.
    const others = await db.records.filter((r) => r.photoIds?.some((p) => record.photoIds!.includes(p)) ?? false).toArray();
    const stillUsed = new Set(others.flatMap((r) => r.photoIds ?? []));
    await db.photos.bulkDelete(record.photoIds.filter((p) => !stillUsed.has(p)));
  });
}
