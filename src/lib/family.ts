import { db, type PersonRow } from '../db';

// The family is fixed. Their names, colours and portraits are added to the app when it is published
// (see .github/workflows/deploy.yml); they are never part of the public code.

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

/** Loads the family into this device. Keeps what it has when the file cannot be reached. */
export async function loadFamily(): Promise<void> {
  let data: { kind?: string; people?: unknown[] };
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}family.json`, { cache: 'no-cache' });
    if (!response.ok) return;
    data = await response.json();
  } catch {
    return;
  }
  if (data?.kind !== 'family' || !Array.isArray(data.people)) return;
  const people = data.people.filter(isPerson).map((p) => ({ name: p.name.trim(), avatar: p.avatar, colour: p.colour }));
  if (!people.length) return;
  await db.transaction('rw', db.people, db.settings, async () => {
    await db.people.clear();
    await db.people.bulkPut(people);
    await db.settings.put({ key: 'people', value: people.map((p) => p.name) });
  });
}
