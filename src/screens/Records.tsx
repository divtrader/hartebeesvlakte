import { useMemo, useState } from 'react';
import { ClipPlayer } from '../components/ClipPlayer';
import { PhotoRow } from '../components/PhotoStrip';
import { RecordRow } from '../components/RecordRow';
import { Empty } from '../components/ui';
import { useRecords, type FieldRecord, type Kind } from '../db';
import { formatDay, plural } from '../lib/format';

type Filter = Kind | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'animal', label: 'Animals' },
  { id: 'plant', label: 'Plants' },
  { id: 'rain', label: 'Rain' },
];

export function Records() {
  const records = useRecords();
  const [filter, setFilter] = useState<Filter>('all');

  const days = useMemo(() => {
    const groups: [string, FieldRecord[]][] = [];
    for (const r of records ?? []) {
      if (filter !== 'all' && r.kind !== filter) continue;
      const day = formatDay(r.at);
      const last = groups[groups.length - 1];
      if (last && last[0] === day) last[1].push(r);
      else groups.push([day, [r]]);
    }
    return groups;
  }, [records, filter]);

  const total = records?.length ?? 0;

  return (
    <>
      <header className="page-head">
        <h1>All records</h1>
        <span className="muted">{plural(total, 'record')} on this device</span>
      </header>
      <div className="chips" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {days.length ? (
        days.map(([day, items]) => (
          <section key={day} className="section">
            <h2 className="day-title">{day}</h2>
            <div className="card row-list">
              {items.map((r) => (
                <div key={r.id} className="record-line">
                  <RecordRow record={r} />
                  {(r.note || r.photoIds?.length || r.clipId) && (
                    <div className="record-line__extra">
                      {r.note && <p>{r.note}</p>}
                      {r.clipId && <ClipPlayer id={r.clipId} />}
                      {r.photoIds?.length ? <PhotoRow ids={r.photoIds} /> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <Empty icon="list" title="No records yet">
          Records you make on this device show here.
        </Empty>
      )}
    </>
  );
}
