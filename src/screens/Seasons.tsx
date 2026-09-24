import { useMemo, useState, type CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { useRecords } from '../db';
import { MONTHS, SEASONS } from '../data/seasons';
import { getSpecies, usuallyFlowering } from '../data/species';
import { plural } from '../lib/format';
import { href } from '../lib/router';

export function Seasons() {
  const records = useRecords();
  const thisMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState(thisMonth);
  const guide = MONTHS[month - 1];
  const season = SEASONS[guide.season];
  const usual = usuallyFlowering(month);

  // What the farm's own records say about this month, one line per year.
  const { years, flowered } = useMemo(() => {
    const byYear = new Map<number, { records: number; rain: number }>();
    const floweredIds = new Set<string>();
    for (const r of records ?? []) {
      const d = new Date(r.at);
      if (d.getMonth() + 1 !== month) continue;
      const y = byYear.get(d.getFullYear()) ?? { records: 0, rain: 0 };
      if (r.kind === 'rain') y.rain += r.mm ?? 0;
      else y.records += 1;
      byYear.set(d.getFullYear(), y);
      if (r.kind === 'plant' && r.stage === 'Flowering' && r.speciesId) floweredIds.add(r.speciesId);
    }
    return {
      years: [...byYear.entries()].sort((a, b) => b[0] - a[0]),
      flowered: [...floweredIds].map(getSpecies).filter((s) => s !== undefined),
    };
  }, [records, month]);

  return (
    <>
      <header className="page-head">
        <h1>Seasons</h1>
        <span className="muted">What the veld usually does each month in this part of the Klein Karoo. Your records sharpen it every year.</span>
      </header>

      <div className="months-grid" role="group" aria-label="Month">
        {MONTHS.map((m, i) => {
          const s = SEASONS[m.season];
          return (
            <button
              key={m.short}
              type="button"
              aria-pressed={month === i + 1}
              aria-label={m.name}
              onClick={() => setMonth(i + 1)}
              style={{ '--season': s.colour } as CSSProperties}
            >
              {m.short}
              <span />
            </button>
          );
        })}
      </div>

      <div className="season-title">
        <h2>{guide.name}</h2>
        <span className="pill" style={{ background: season.tint, color: season.colour }}>
          {guide.season} · {season.af}
        </span>
        {month === thisMonth && <span className="pill pill--dark">This month</span>}
      </div>

      <section className="card guide">
        <div className="guide__head">
          <span className="avatar" style={{ background: '#F1DCE7', color: '#8E2A5E', width: 34, height: 34 }}>
            <Icon name="flower" size={18} />
          </span>
          <strong>In flower</strong>
        </div>
        {usual.length ? (
          <div className="chips">
            {usual.map((s) => (
              <a key={s.id} className="dot-chip" href={href(`species/${s.id}`)}>
                <i style={{ background: s.colour }} />
                {s.en}
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">Few plants flower now. Record anything you find.</p>
        )}
        {flowered.length > 0 && (
          <p className="guide__note">
            Recorded flowering on the farm in {guide.name}: {flowered.map((s) => s.en).join(', ')}.
          </p>
        )}
      </section>

      <section className="card row-list">
        <div className="guide__row">
          <span className="avatar" style={{ background: '#DCEAF0', color: '#2D6A88', width: 34, height: 34 }}>
            <Icon name="bird" size={18} />
          </span>
          <div>
            <span className="eyebrow">Birds</span>
            <p>{guide.birds}</p>
          </div>
        </div>
        <div className="guide__row">
          <span className="avatar" style={{ background: '#F3E1D6', color: '#A94A24', width: 34, height: 34 }}>
            <Icon name="paw" size={18} />
          </span>
          <div>
            <span className="eyebrow">Animals</span>
            <p>{guide.animals}</p>
          </div>
        </div>
        <div className="guide__row">
          <span className="avatar" style={{ background: '#DFE6EC', color: '#466178', width: 34, height: 34 }}>
            <Icon name="drop" size={18} />
          </span>
          <div>
            <span className="eyebrow">Veld and weather</span>
            <p>{guide.veld}</p>
          </div>
        </div>
      </section>

      <section className="card dark-card">
        <span className="eyebrow">Your records in {guide.name}</span>
        {years.length ? (
          years.map(([year, y]) => (
            <p key={year}>
              <strong>{year}</strong> · {plural(y.records, 'record')} · {Math.round(y.rain * 10) / 10} mm rain
            </p>
          ))
        ) : (
          <p>Nothing recorded in {guide.name} yet.</p>
        )}
      </section>
    </>
  );
}
