// Wikipedia and Wikimedia Commons helpers, shared by the app and scripts/species-photos.mts.

export const USER_AGENT = 'HartebeesvlakteVeldboek/0.1 (https://github.com/divtrader/hartebeesvlakte)';

export interface WikiPhoto {
  credit: string;
  licence: string;
  licenceUrl?: string;
  /** The file's page on Wikimedia Commons. */
  source: string;
}

export interface WikiSummary {
  type?: string;
  title: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  originalimage?: { source: string };
  thumbnail?: { source: string };
}

export function summaryUrl(title: string): string {
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

/** The Commons file name in an image address, or undefined for files that are not on Commons (possibly not free). */
export function commonsFileName(imageUrl: string | undefined): string | undefined {
  const match = imageUrl?.match(/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function imageInfoUrl(file: string, width: number): string {
  return `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=${width}&titles=${encodeURIComponent(`File:${file}`)}`;
}

export function plainText(html: string | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Thumbnail address and credit from a Commons imageinfo response; undefined when the licence is not free. */
export function readImageInfo(data: unknown): { thumb: string; photo: WikiPhoto } | undefined {
  const pages = (data as { query?: { pages?: Record<string, unknown> } })?.query?.pages;
  const page = pages && (Object.values(pages)[0] as { imageinfo?: { thumburl?: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] });
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) return undefined;
  const meta = info.extmetadata ?? {};
  const licence = plainText(meta.LicenseShortName?.value) || 'see source';
  if (/fair use|non-free/i.test(licence)) return undefined;
  return {
    thumb: info.thumburl,
    photo: {
      credit: plainText(meta.Artist?.value) || 'Unknown photographer',
      licence,
      licenceUrl: meta.LicenseUrl?.value,
      source: info.descriptionurl,
    },
  };
}

/** The first few sentences, at most about 360 characters. */
export function shortenExtract(text: string): string {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > 360) break;
    out += s;
  }
  return out.trim();
}
