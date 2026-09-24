import { useEffect, useRef, useState } from 'react';
import { db, setSetting, useSetting } from '../db';
import { DEFAULT_CAMPS } from '../data/farm';
import { useGps } from './gps';
import { moonPhase } from './moon';

/** Who, where and when for a new record: recorder, camp, GPS position and moon phase. */
export function useFieldContext() {
  const recorder = useSetting<string>('recorder', '');
  const camps = useSetting<string[]>('camps', DEFAULT_CAMPS);
  const lastCamp = useSetting<string>('lastCamp', '');
  const [chosen, setChosen] = useState<string>();
  const [gps, retry] = useGps();

  const camp = chosen ?? (camps.includes(lastCamp) ? lastCamp : (camps[0] ?? ''));

  function setCamp(next: string) {
    setChosen(next);
    void setSetting('lastCamp', next);
  }

  function base(at = Date.now()) {
    const pos = gps.status === 'found' ? gps.pos : undefined;
    return {
      at,
      by: recorder || 'Unknown',
      camp: camp || undefined,
      lat: pos?.lat,
      lng: pos?.lng,
      acc: pos?.acc,
      moon: moonPhase(new Date(at)),
    };
  }

  return { recorder, camps, camp, setCamp, gps, retry, base };
}

/** Photo ids for a form. Photos of a form that is left without saving are removed again. */
export function useFormPhotos(): [string[], (ids: string[]) => void, () => void] {
  const [ids, setIds] = useState<string[]>([]);
  const idsRef = useRef(ids);
  const saved = useRef(false);
  idsRef.current = ids;
  useEffect(
    () => () => {
      if (!saved.current && idsRef.current.length) void db.photos.bulkDelete(idsRef.current);
    },
    [],
  );
  return [ids, setIds, () => (saved.current = true)];
}
