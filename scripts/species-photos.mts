// Fetches a photo and a short description for every species from Wikipedia and Wikimedia Commons,
// with the photographer and licence for the credit line. Run with `npm run species` and commit the result.
//   public/species/<id>.webp     photo for the species page (720 x 480)
//   public/species/<id>-s.webp   small square photo for lists (112 x 112)
//   src/data/species-info.json   summary, article link and photo credit per species
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SPECIES } from '../src/data/species.ts';
import { USER_AGENT, commonsFileName, imageInfoUrl, readImageInfo, shortenExtract, summaryUrl } from '../src/lib/wiki.ts';

const HEADERS = { 'User-Agent': USER_AGENT };
const OUT_PHOTOS = new URL('../public/species/', import.meta.url);
const OUT_INFO = new URL('../src/data/species-info.json', import.meta.url);

// Article titles where neither the scientific nor the English name finds the right page.
const ARTICLE: Record<string, string> = {
  vygies: 'Drosanthemum',
  kapokbos: 'Eriocephalus',
  guarri: 'Euclea',
  renosterbos: 'Dicerothamnus rhinocerotis',
  'chacma-baboon': 'Chacma baboon',
};

// Where to crop when the subject is not in the middle of the photo.
const CROP: Record<string, string> = {
  'cape-cobra': 'north',
  'april-fool': 'north',
};

interface Info {
  title: string;
  url: string;
  extract: string;
  photo?: { credit: string; licence: string; licenceUrl?: string; source: string };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch with polite retries: Wikimedia answers 429 when asked too quickly. */
async function get(url: string): Promise<Response | undefined> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: HEADERS });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) return undefined;
    await pause(2000 * (attempt + 1));
  }
  return undefined;
}

async function json(url: string) {
  const response = await get(url);
  return response ? response.json() : undefined;
}

async function summary(title: string) {
  const data = await json(summaryUrl(title));
  return data?.type === 'standard' && data.extract ? data : undefined;
}

async function commonsPhoto(originalUrl: string) {
  const file = commonsFileName(originalUrl);
  if (!file) return undefined;
  const found = readImageInfo(await json(imageInfoUrl(file, 960)));
  return found && { thumb: found.thumb, ...found.photo };
}

await mkdir(OUT_PHOTOS, { recursive: true });
const result: Record<string, Info> = {};
const missing: string[] = [];

for (const s of SPECIES) {
  if (s.unknown) continue;
  const candidates = [ARTICLE[s.id], s.sci, s.en].filter((t): t is string => Boolean(t));
  let page;
  for (const title of candidates) {
    page = await summary(title);
    if (page) break;
    await pause(150);
  }
  if (!page) {
    missing.push(`${s.id} (no article)`);
    continue;
  }
  const info: Info = { title: page.title, url: page.content_urls?.desktop?.page, extract: shortenExtract(page.extract) };
  const photo = page.originalimage?.source ? await commonsPhoto(page.originalimage.source) : undefined;
  if (photo) {
    const image = await get(photo.thumb);
    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const position = CROP[s.id] ?? 'centre';
      await sharp(buffer).resize(720, 480, { fit: 'cover', position }).webp({ quality: 74 }).toFile(fileURLToPath(new URL(`${s.id}.webp`, OUT_PHOTOS)));
      await sharp(buffer).resize(112, 112, { fit: 'cover', position }).webp({ quality: 72 }).toFile(fileURLToPath(new URL(`${s.id}-s.webp`, OUT_PHOTOS)));
      info.photo = { credit: photo.credit, licence: photo.licence, licenceUrl: photo.licenceUrl, source: photo.source };
    }
  }
  if (!info.photo) missing.push(`${s.id} (no free photo)`);
  result[s.id] = info;
  console.log(`${s.id}: ${page.title}${info.photo ? '' : ' (no photo)'}`);
  await pause(600);
}

await writeFile(OUT_INFO, `${JSON.stringify(result, null, 2)}\n`);
console.log(`\n${Object.keys(result).length} species written.`);
if (missing.length) console.log(`Check: ${missing.join(', ')}`);
