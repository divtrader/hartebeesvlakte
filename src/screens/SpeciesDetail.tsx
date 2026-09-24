import { useMemo } from 'react';
import { ClipPlayer } from '../components/ClipPlayer';
import { Icon } from '../components/Icon';
import { PhotoRow } from '../components/PhotoStrip';
import { RecordRow } from '../components/RecordRow';
import { Empty, GroupAvatar, TopBar } from '../components/ui';
import { useRecords } from '../db';
import { GROUPS, getSpecies } from '../data/species';
import { MONTHS } from '../data/seasons';
import { useSpeciesMedia } from '../lib/speciesMedia';
import { formatDay } from '../lib/format';
import { speciesSummary } from '../lib/records';
import { href } from '../lib/router';
import { NotFound } from './NotFound';

export function SpeciesDetail({ id }: { id: string }) {
  const species = getSpecies(id);
  const records = useRecords();
  const mine = useMemo(() => (records ?? []).filter((r) => r.speciesId === id), [records, id]);
  const summary = useMemo(() => speciesSummary(mine, id), [mine, id]);
  const { info, photo } = useSpeciesMedia(species);

  if (!species) return <NotFound />;
  const group = GROUPS[species.group];

  const isPlant = species.group === 'plants';
  const photos = mine.flatMap((r) => r.photoIds ?? []).slice(0, 12);
  const clips = mine.filter((r) => r.clipId).slice(0, 5);
  const peak = Math.max(1, ...summary.byMonth);
  const currentMonth = new Date().getMonth();

  return (
    <>
      <TopBar title={species.en} subtitle={group.label} backTo="species" />
      {photo ? (
        <figure className="species-photo">
          <img src={photo} alt={species.en} />
          <figcaption>
            <div>
              <h2>{species.en}</h2>
              <span>
                {species.af}
                {species.sci && (
                  <>
                    {' · '}
                    <i>{species.sci}</i>
                  </>
                )}
              </span>
            </div>
          </figcaption>
        </figure>
      ) : (
        <section className="species-hero card">
          <GroupAvatar group={species.group} size={64} />
          <div>
            <h2>{species.en}</h2>
            <span className="muted">
              {species.af}
              {species.sci && (
                <>
                  {' · '}
                  <i>{species.sci}</i>
                </>
              )}
            </span>
          </div>
        </section>
      )}

      {info && (
        <section className="card species-about">
          <h3>About</h3>
          <p>{info.extract}</p>
          <p className="species-about__credit">
            <a href={info.url} target="_blank" rel="noreferrer">
              Read more on Wikipedia
            </a>
            {info.photo && (
              <>
                {' · Photo: '}
                <a href={info.photo.source} target="_blank" rel="noreferrer">
                  {info.photo.credit}
                </a>
                {`, ${info.photo.licence}`}
              </>
            )}
          </p>
        </section>
      )}

      <div className="stats">
        <div className="stat card">
          <strong>{summary.records}</strong>
          <span>{summary.records === 1 ? 'record' : 'records'}</span>
        </div>
        {isPlant ? (
          <div className="stat card">
            <strong>{summary.floweringMonths.length ? summary.floweringMonths.map((m) => MONTHS[m - 1].short).join(', ') : 'None yet'}</strong>
            <span>seen flowering in</span>
          </div>
        ) : (
          <div className="stat card">
            <strong>{summary.animals}</strong>
            <span>animals counted in total</span>
          </div>
        )}
        <div className="stat card">
          <strong>{summary.last ? formatDay(summary.last.at) : 'Not yet'}</strong>
          <span>{summary.last?.camp ? `last seen, ${summary.last.camp}` : 'last seen'}</span>
        </div>
      </div>

      <section className="card months">
        <h3>{isPlant ? 'Flowering and records by month' : 'Records by month'}</h3>
        <div className="months__bars">
          {MONTHS.map((m, i) => {
            const usual = species.flowers?.includes(i + 1);
            const flowered = summary.floweringMonths.includes(i + 1);
            return (
              <div key={m.short} className="months__col" data-now={i === currentMonth}>
                <span className="months__bar-wrap">
                  <span className="months__bar" style={{ height: `${(summary.byMonth[i] / peak) * 100}%`, background: group.colour }} />
                </span>
                {isPlant && (
                  <span
                    className="months__flower"
                    data-usual={usual}
                    data-flowered={flowered}
                    title={flowered ? 'Recorded flowering' : usual ? 'Usually flowers' : undefined}
                  />
                )}
                <span className="months__label">{m.short[0]}</span>
              </div>
            );
          })}
        </div>
        {isPlant && (
          <div className="legend">
            <span>
              <i className="legend__usual" /> Usually flowers
            </span>
            <span>
              <i className="legend__flowered" /> Recorded flowering
            </span>
          </div>
        )}
      </section>

      <a className="btn btn--primary" href={href(`${isPlant ? 'plant' : 'sighting'}?species=${species.id}`)}>
        <Icon name="plus" size={20} strokeWidth={2.2} />
        {isPlant ? 'Record this plant' : 'Record a sighting'}
      </a>

      {photos.length > 0 && (
        <section className="section">
          <h2>Photos</h2>
          <PhotoRow ids={photos} />
        </section>
      )}

      {clips.length > 0 && (
        <section className="section">
          <h2>Recordings</h2>
          <div className="card clips">
            {clips.map((r) => (
              <div key={r.id} className="clips__row">
                <span className="muted">
                  {formatDay(r.at)} · {Math.round((r.confidence ?? 0) * 100)}% sure
                </span>
                <ClipPlayer id={r.clipId!} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>{mine.length > 20 ? 'Latest 20 records' : 'Records'}</h2>
        {mine.length ? (
          <div className="card row-list">
            {mine.slice(0, 20).map((r) => (
              <RecordRow key={r.id} record={r} showDay />
            ))}
          </div>
        ) : (
          <Empty icon={group.icon} title="Not recorded yet">
            The first record will show here.
          </Empty>
        )}
      </section>
    </>
  );
}
