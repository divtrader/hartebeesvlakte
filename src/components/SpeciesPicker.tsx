import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { GroupAvatar } from './ui';
import { getSpecies, matchesSearch, speciesInGroups, type Group, type Species } from '../data/species';

interface Props {
  groups: Group[];
  value: string | undefined;
  onChange: (id: string) => void;
  usage: Map<string, number>;
  /** Border colour of the chosen species card. */
  colour: string;
}

const SHORT_LIST = 8;

export function SpeciesPicker({ groups, value, onChange, usage, colour }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(!value);
  const selected = getSpecies(value);

  const matches = useMemo(() => {
    // Most recorded first, then the species list's own order (likeliest species first).
    const byUse = (a: Species, b: Species) =>
      Number(a.unknown ?? false) - Number(b.unknown ?? false) || (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0);
    return speciesInGroups(groups).filter((s) => matchesSearch(s, query)).sort(byUse);
  }, [groups, query, usage]);

  if (selected && !open) {
    return (
      <div className="picked card" style={{ borderColor: colour }}>
        <GroupAvatar group={selected.group} />
        <div className="picked__text">
          <strong>{selected.en}</strong>
          <span>
            {selected.af}
            {selected.sci && (
              <>
                {' · '}
                <i>{selected.sci}</i>
              </>
            )}
          </span>
        </div>
        <button type="button" className="btn btn--ghost btn--small" style={{ color: colour }} onClick={() => setOpen(true)}>
          Change
        </button>
      </div>
    );
  }

  const known = matches.filter((s) => !s.unknown);
  const unknown = matches.filter((s) => s.unknown);
  const shown = query ? matches : [...known.slice(0, SHORT_LIST), ...unknown];
  const hidden = query ? 0 : Math.max(0, known.length - SHORT_LIST);

  return (
    <div className="picker">
      <label className="search">
        <Icon name="search" size={20} />
        <input
          type="search"
          placeholder="Name in English or Afrikaans"
          aria-label="Find a species"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="card row-list">
        {shown.map((s) => (
          <button
            key={s.id}
            type="button"
            className="list-row"
            onClick={() => {
              onChange(s.id);
              setOpen(false);
              setQuery('');
            }}
          >
            <GroupAvatar group={s.group} size={36} />
            <span className="list-row__text">
              <span className="list-row__title">{s.en}</span>
              <span className="list-row__meta">{s.af}</span>
            </span>
            {value === s.id && <Icon name="check" size={20} />}
          </button>
        ))}
        {!shown.length && <p className="picker__none">Nothing found. Save it as unknown and name it later.</p>}
      </div>
      {hidden > 0 && <span className="field__hint">Type a name to see {hidden} more species.</span>}
    </div>
  );
}
