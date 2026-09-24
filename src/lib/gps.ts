import { useCallback, useEffect, useState } from 'react';

export interface Position {
  lat: number;
  lng: number;
  /** Accuracy in metres. */
  acc: number;
}

export type GpsState =
  | { status: 'finding' }
  | { status: 'found'; pos: Position }
  | { status: 'failed'; message: string };

export function getPosition(timeoutMs = 20_000): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device has no GPS'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      reject,
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

function describe(error: unknown): string {
  const code = (error as GeolocationPositionError | undefined)?.code;
  if (code === 1) return 'Location is switched off for this app';
  if (code === 3) return 'No GPS fix yet';
  return 'Could not find your position';
}

/** Starts looking for the position straight away; call `retry` to try again. */
export function useGps(): [GpsState, () => void] {
  const [state, setState] = useState<GpsState>({ status: 'finding' });
  const find = useCallback(() => {
    setState({ status: 'finding' });
    getPosition().then(
      (pos) => setState({ status: 'found', pos }),
      (error) => setState({ status: 'failed', message: describe(error) }),
    );
  }, []);
  useEffect(() => find(), [find]);
  return [state, find];
}
