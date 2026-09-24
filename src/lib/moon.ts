const SYNODIC_MONTH = 29.530588853;
// A known new moon: 6 January 2000, 18:14 UTC.
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** Days since the last new moon, 0 to 29.5. */
export function moonAge(date: Date): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  return ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
}

const PHASES: [number, string][] = [
  [1.85, 'New moon'],
  [5.54, 'Waxing crescent'],
  [9.23, 'First quarter'],
  [12.92, 'Waxing gibbous'],
  [16.61, 'Full moon'],
  [20.3, 'Waning gibbous'],
  [23.99, 'Last quarter'],
  [27.68, 'Waning crescent'],
];

export function moonPhase(date: Date): string {
  const age = moonAge(date);
  return PHASES.find(([limit]) => age < limit)?.[1] ?? 'New moon';
}
