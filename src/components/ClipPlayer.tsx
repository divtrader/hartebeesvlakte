import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

/** Plays back the 3 second recording a bird was identified from. */
export function ClipPlayer({ id }: { id: string }) {
  const row = useLiveQuery(() => db.clips.get(id), [id]);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!row) return;
    const next = URL.createObjectURL(row.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [row]);
  return url ? <audio className="clip" controls preload="none" src={url} aria-label="Recording of the call" /> : null;
}
