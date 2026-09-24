import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { GroupAvatar } from '../components/ui';
import { useRecords } from '../db';
import { GROUPS, allSpecies, matchesSearch, type Group } from '../data/species';
import { formatDay } from '../lib/format';
import { href } from '../lib/router';

type Filter = Group | 'all';

const FILTERS: Filter[] = ['all', 'game', 'birds', 'predators', 'small', 'plants'];

export function SpeciesList() {
  const records = useRecords();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const seen = useMemo(() => {
    const map = new Map<string, { count: number; last: number }>();
    for (const r of records ?? []) {
      if (!r.speciesId) continue;
      const entry = map.get(r.speciesId) ?? { count: 0, last: 0 };
      entry.count += 1;
      entry.last = Math.max(entry.last, r.at);
      map.set(r.speciesId, entry);
    }
    return map;
  }, [records]);

  const list = allSpecies().filter((s) => (filter === 'all' || s.group === filter) && matchesSearch(s, query)).sort(
    (a, b) =>
      Number(a.unknown ?? false) - Number(b.unknown ?? false) ||
      (seen.get(b.id)?.count ?? 0) - (seen.get(a.id)?.count ?? 0) ||
      a.en.localeCompare(b.en),
  );
  const recorded = allSpecies().filter((s) => !s.unknown && seen.has(s.id)).length;
  const known = allSpecies().filter((s) => !s.unknown).length;

  return (
    <>
      <header className="page-head">
        <h1>Species</h1>
        <span className="muted">
          {recorded} of {known} species on the list recorded so far
        </span>
      </header>
      <label className="search">
        <Icon name="search" size={20} />
        <input type="search" placeholder="Name in English or Afrikaans" aria-label="Find a species" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="chips chips--scroll" role="group" aria-label="Group">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : GROUPS[f].label}
          </button>
        ))}
      </div>
      <div className="card row-list">
        {list.map((s) => {
          const info = seen.get(s.id);
          return (
            <a key={s.id} className="list-row" href={href(`species/${s.id}`)}>
              <GroupAvatar group={s.group} />
              <span className="list-row__text">
                <span className="list-row__title">{s.en}</span>
                <span className="list-row__meta">
                  {s.af}
                  {info ? ` · last ${formatDay(info.last).toLowerCase()}` : ''}
                </span>
              </span>
              <span className={`list-row__value${info ? '' : ' list-row__value--none'}`}>{info ? `${info.count}×` : 'Not yet'}</span>
            </a>
          );
        })}
        {!list.length && <p className="picker__none">No species match that name.</p>}
      </div>
    </>
  );
}
