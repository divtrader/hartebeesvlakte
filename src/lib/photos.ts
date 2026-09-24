import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, uid } from '../db';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the photo'));
    img.src = url;
  });
}

/** Shrinks a camera photo to at most `max` pixels on the long side, as JPEG, to save space on the phone. */
export async function shrinkPhoto(file: Blob, max = 1600, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality),
    );
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Stores the photos and returns their ids. */
export async function storePhotos(files: Iterable<File>): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    const blob = await shrinkPhoto(file);
    const id = uid();
    await db.photos.put({ id, blob, at: Date.now() });
    ids.push(id);
  }
  return ids;
}

/** An object URL for a stored photo, released again when no longer needed. */
export function usePhotoUrl(id: string | undefined): string | undefined {
  const row = useLiveQuery(() => (id ? db.photos.get(id) : undefined), [id]);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!row) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(row.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [row]);
  return url;
}
