import type { CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PersonRow } from '../db';

const FALLBACK = ['#2D6A88', '#A94A24', '#56702A', '#9A6412', '#466178', '#5A6B2E', '#9C4A22', '#8E2A5E'];

function colourFor(name: string, person?: PersonRow): string {
  if (person?.colour) return person.colour;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK[hash % FALLBACK.length];
}

// Faces already loaded, so a face that is drawn again never flashes its initials first.
const loaded = new Map<string, PersonRow>();

function usePerson(name: string): PersonRow | undefined {
  return useLiveQuery(
    async () => {
      const person = name ? await db.people.get(name) : undefined;
      if (person) loaded.set(name, person);
      else loaded.delete(name);
      return person;
    },
    [name],
    loaded.get(name),
  );
}

export function usePeople(): PersonRow[] {
  return useLiveQuery(() => db.people.toArray(), []) ?? [];
}

interface Props {
  name: string;
  size?: number;
  /** Ring in the person's colour, for whoever is recording on this device. */
  active?: boolean;
}

/** A family member's portrait from the family file; initials when there is none. */
export function PersonAvatar({ name, size = 40, active = false }: Props) {
  const person = usePerson(name);
  const style = { width: size, height: size, '--person': colourFor(name, person) } as CSSProperties;
  return (
    <span className={`person${active ? ' person--active' : ''}`} style={style} role="img" aria-label={name}>
      <span className="person__face">
        {person?.avatar ? (
          <img src={person.avatar} alt="" draggable={false} />
        ) : (
          <span className="person__initials" style={{ fontSize: size * 0.4 }}>
            {name.trim().slice(0, 1).toUpperCase() || '?'}
          </span>
        )}
      </span>
    </span>
  );
}
