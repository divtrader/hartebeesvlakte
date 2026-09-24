import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type FetchedInfo } from '../db';
import type { Species } from '../data/species';
import { speciesInfo, speciesPhoto, type SpeciesInfo } from '../data/speciesInfo';
import { commonsFileName, imageInfoUrl, readImageInfo, shortenExtract, summaryUrl, type WikiSummary } from './wiki';

const RETRY_MS = 3 * 86_400_000;
const busy = new Set<string>();

async function getJson<T>(url: string): Promise<T | undefined> {
  const response = await fetch(url);
  return response.ok ? ((await response.json()) as T) : undefined;
}

async function findSummary(species: Species): Promise<WikiSummary | undefined> {
  for (const title of [species.sci, species.en]) {
    if (!title) continue;
    const page = await getJson<WikiSummary>(summaryUrl(title));
    if (page?.type === 'standard' && page.extract) return page;
  }
  return undefined;
}

/**
 * Fetches a photo and summary for a species that has none built in, such as a bird BirdNET heard,
 * and keeps them on the device so they show without signal later. Does nothing when offline.
 */
export async function fetchSpeciesInfo(species: Species): Promise<void> {
  if (species.unknown || speciesInfo(species.id) || busy.has(species.id) || !navigator.onLine) return;
  const known = await db.speciesInfo.get(species.id);
  if (known && (known.image || Date.now() - known.fetchedAt < RETRY_MS)) return;
  busy.add(species.id);
  try {
    const page = await findSummary(species);
    const row: FetchedInfo = { id: species.id, fetchedAt: Date.now() };
    if (page) {
      row.title = page.title;
      row.url = page.content_urls?.desktop?.page;
      row.extract = shortenExtract(page.extract ?? '');
      const file = commonsFileName(page.originalimage?.source ?? page.thumbnail?.source);
      const found = file ? readImageInfo(await getJson(imageInfoUrl(file, 640))) : undefined;
      if (found) {
        const image = await fetch(found.thumb);
        if (image.ok) {
          row.image = await image.blob();
          row.photo = found.photo;
        }
      }
    }
    await db.speciesInfo.put(row);
  } catch {
    // Lost signal part way; try again another time.
  } finally {
    busy.delete(species.id);
  }
}

export interface SpeciesMedia {
  info?: SpeciesInfo;
  /** Photo for the species page. */
  photo?: string;
  /** Photo for small round thumbnails. */
  small?: string;
}

/** The species' photo and summary: built in for the starter list, fetched and kept for birds added by sound. */
export function useSpeciesMedia(species: Species | undefined): SpeciesMedia {
  const builtIn = species ? speciesInfo(species.id) : undefined;
  const lookUp = species && !builtIn && !species.unknown ? species.id : undefined;
  const fetched = useLiveQuery(() => (lookUp ? db.speciesInfo.get(lookUp) : undefined), [lookUp]);
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (lookUp && species) void fetchSpeciesInfo(species);
    // Keyed on the id alone: the species object is rebuilt on every render.
  }, [lookUp]);

  useEffect(() => {
    if (!fetched?.image) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(fetched.image);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [fetched]);

  if (builtIn) return { info: builtIn, photo: speciesPhoto(species!.id), small: speciesPhoto(species!.id, true) };
  if (!fetched?.title) return {};
  return {
    info: { title: fetched.title, url: fetched.url ?? '', extract: fetched.extract ?? '', photo: fetched.photo },
    photo: url,
    small: url,
  };
}
