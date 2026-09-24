import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PersonAvatar } from '../components/PersonAvatar';
import { PlaceCard } from '../components/PlaceCard';
import { PhotoStrip } from '../components/PhotoStrip';
import { ActionBar, SpeciesThumb, TopBar } from '../components/ui';
import { db, saveRecords, useRecords } from '../db';
import { ANIMAL_GROUPS, GROUPS, matchesSearch, speciesInGroups, type Group, type Species } from '../data/species';
import { useFieldContext } from '../lib/fieldContext';
import { formatTime, plural } from '../lib/format';
import { countToRecords, usageBySpecies } from '../lib/records';
import { go } from '../lib/router';
import { toast } from '../lib/toast';

const DRAFT_KEY = 'veldboek.countDraft';

interface Draft {
  counts: Record<string, number>;
  history: [string, number][];
  startedAt: number;
  group: Group;
  photoIds: string[];
}

function freshDraft(): Draft {
  return { counts: {}, history: [], startedAt: Date.now(), group: 'game', photoIds: [] };
}

// The count in progress is kept on the phone, so a locked screen or a wrong tap never loses it.
function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as Partial<Draft>;
      if (draft && typeof draft.counts === 'object') return { ...freshDraft(), ...draft };
    }
  } catch {
    // Storage unavailable or damaged; start a new count.
  }
  return freshDraft();
}

/** Animals in a count that was started but not saved yet. */
export function countDraftTotal(): number {
  return Object.values(loadDraft().counts).reduce((a, b) => a + b, 0);
}

function TallyRow({ species, n, onChange }: { species: Species; n: number; onChange: (delta: number) => void }) {
  return (
    <div className="tally__row">
      <SpeciesThumb species={species} size={46} />
      <span className="list-row__text">
        <span className="list-row__title">{species.en}</span>
        <span className="list-row__meta">{species.af}</span>
      </span>
      <button type="button" className="tally__minus" aria-label={`Remove one ${species.en}`} disabled={!n} onClick={() => onChange(-1)}>
        <Icon name="minus" size={20} strokeWidth={2.2} />
      </button>
      <span className="tally__n" data-zero={n === 0} aria-live="polite">
        {n}
      </span>
      <button
        type="button"
        className="tally__plus"
        style={{ background: GROUPS[species.group].colour }}
        aria-label={`Add one ${species.en}`}
        onClick={() => onChange(1)}
      >
        <Icon name="plus" size={22} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function Count() {
  const ctx = useFieldContext();
  const records = useRecords();
  const usage = useMemo(() => usageBySpecies(records ?? []), [records]);
  const [draft, setDraft] = useState(loadDraft);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private browsing; the count still works, it just is not kept.
    }
  }, [draft]);

  // Keep the order steady while counting: most recorded first, then the species list's own order, unknown last.
  const list = useMemo(() => {
    const pool = query ? speciesInGroups(ANIMAL_GROUPS).filter((s) => matchesSearch(s, query)) : speciesInGroups([draft.group]);
    return [...pool].sort(
      (a, b) => Number(a.unknown ?? false) - Number(b.unknown ?? false) || (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0),
    );
  }, [query, draft.group, usage]);

  const values = Object.values(draft.counts);
  const total = values.reduce((a, b) => a + b, 0);
  const species = values.filter((n) => n > 0).length;

  function change(id: string, delta: number) {
    navigator.vibrate?.(8);
    setDraft((prev) => {
      const before = prev.counts[id] ?? 0;
      const after = Math.max(0, before + delta);
      if (after === before) return prev;
      return { ...prev, counts: { ...prev.counts, [id]: after }, history: [...prev.history, [id, after - before]] };
    });
  }

  function undo() {
    setDraft((prev) => {
      const last = prev.history[prev.history.length - 1];
      if (!last) return prev;
      const [id, delta] = last;
      return { ...prev, counts: { ...prev.counts, [id]: Math.max(0, (prev.counts[id] ?? 0) - delta) }, history: prev.history.slice(0, -1) };
    });
  }

  async function clear() {
    if (!window.confirm('Clear this count and start again?')) return;
    if (draft.photoIds.length) await db.photos.bulkDelete(draft.photoIds);
    setDraft(freshDraft());
  }

  async function save() {
    if (!total) {
      toast('Tap + for each animal first');
      return;
    }
    setSaving(true);
    try {
      const base = { ...ctx.base(), photoIds: draft.photoIds.length ? draft.photoIds : undefined };
      await saveRecords(countToRecords(draft.counts, base));
      localStorage.removeItem(DRAFT_KEY);
      toast(`Saved ${plural(total, 'animal')}`);
      go('');
    } catch {
      toast('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title="Quick count"
        subtitle="Tap + for every animal you see"
        right={
          <button type="button" className="btn btn--small" onClick={undo} disabled={!draft.history.length}>
            <Icon name="undo" size={18} strokeWidth={2} />
            Undo
          </button>
        }
      />
      <PlaceCard gps={ctx.gps} retry={ctx.retry} camp={ctx.camp} camps={ctx.camps} onCamp={ctx.setCamp} />

      <div className="segmented" role="tablist" aria-label="Animal group">
        {ANIMAL_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={!query && draft.group === g}
            onClick={() => {
              setQuery('');
              setDraft((prev) => ({ ...prev, group: g }));
            }}
          >
            {GROUPS[g].label}
          </button>
        ))}
      </div>

      <div className="total">
        <div className="total__main">
          <span className="eyebrow">Total this count</span>
          <strong>{total}</strong>
        </div>
        <div className="total__side">
          <strong>{plural(species, 'species', 'species')}</strong>
          <span>Started {formatTime(draft.startedAt)}</span>
          {ctx.recorder && (
            <span className="total__who">
              <PersonAvatar name={ctx.recorder} size={24} />
              {ctx.recorder}
            </span>
          )}
        </div>
      </div>

      <label className="search">
        <Icon name="search" size={20} />
        <input type="search" placeholder="Find any animal" aria-label="Find any animal" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <div className="card tally">
        {list.map((s) => (
          <TallyRow key={s.id} species={s} n={draft.counts[s.id] ?? 0} onChange={(d) => change(s.id, d)} />
        ))}
        {!list.length && <p className="picker__none">Nothing found. Use Unknown animal and add a note later.</p>}
      </div>

      <PhotoStrip ids={draft.photoIds} onChange={(photoIds) => setDraft((prev) => ({ ...prev, photoIds }))} />

      {(total > 0 || draft.photoIds.length > 0) && (
        <button type="button" className="btn btn--ghost" onClick={clear}>
          Clear this count
        </button>
      )}

      <ActionBar>
        <button type="button" className="btn btn--primary btn--grow" onClick={save} disabled={saving}>
          <Icon name="check" size={20} strokeWidth={2.4} />
          Save count · {total}
        </button>
      </ActionBar>
    </>
  );
}
