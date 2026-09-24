// The BirdNET model is not part of the app download. It is fetched once, on request, into its own cache;
// the service worker then serves it from there, so identification works without signal.

export const MODEL_BASE = `${import.meta.env.BASE_URL}models/birdnet/`;
export const MODEL_CACHE = 'birdnet-model';

const SHARD = 4_194_304;

export const MODEL_FILES: [string, number][] = [
  ['model.json', 893_632],
  ...Array.from({ length: 12 }, (_, i): [string, number] => [`group1-shard${i + 1}of13.bin`, SHARD]),
  ['group1-shard13of13.bin', 990_032],
  ['area-model/model.json', 27_328],
  ['area-model/group1-shard1of2.bin', SHARD],
  ['area-model/group1-shard2of2.bin', 2_864_028],
  ['labels/en_uk.txt', 259_894],
  ['labels/af.txt', 258_587],
];

export const MODEL_BYTES = MODEL_FILES.reduce((sum, [, size]) => sum + size, 0);

export function modelUrl(file = ''): string {
  return new URL(MODEL_BASE + file, window.location.href).href;
}

export async function isModelDownloaded(): Promise<boolean> {
  if (!('caches' in window)) return false;
  const cache = await caches.open(MODEL_CACHE);
  const found = await Promise.all(MODEL_FILES.map(([file]) => cache.match(modelUrl(file))));
  return found.every(Boolean);
}

/** Downloads every model file that is not cached yet, reporting progress from 0 to 1. */
export async function downloadModel(onProgress: (fraction: number) => void): Promise<void> {
  if (!('caches' in window)) throw new Error('This browser cannot store the bird model');
  const cache = await caches.open(MODEL_CACHE);
  let done = 0;
  for (const [file, size] of MODEL_FILES) {
    const url = modelUrl(file);
    if (!(await cache.match(url))) {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Download failed (${response.status}). Check the signal and try again.`);
      await cache.put(url, response);
    }
    done += size;
    onProgress(done / MODEL_BYTES);
  }
}

export async function deleteModel(): Promise<void> {
  if ('caches' in window) await caches.delete(MODEL_CACHE);
}
