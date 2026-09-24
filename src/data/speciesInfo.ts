import raw from './species-info.json';

export interface SpeciesInfo {
  /** Wikipedia article title. */
  title: string;
  url: string;
  /** The first few sentences of the article. */
  extract: string;
  photo?: { credit: string; licence: string; licenceUrl?: string; source: string };
}

// Built by scripts/species-photos.mts from Wikipedia and Wikimedia Commons.
const INFO = raw as Record<string, SpeciesInfo>;

export function speciesInfo(id: string | undefined): SpeciesInfo | undefined {
  return id ? INFO[id] : undefined;
}

/** The species photo, or the small square version for lists. Undefined when there is no photo. */
export function speciesPhoto(id: string | undefined, small = false): string | undefined {
  if (!id || !INFO[id]?.photo) return undefined;
  return `${import.meta.env.BASE_URL}species/${id}${small ? '-s' : ''}.webp`;
}
