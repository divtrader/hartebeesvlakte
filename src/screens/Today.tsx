import type { CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { FlowerMark } from '../components/FlowerMark';
import { PersonAvatar } from '../components/PersonAvatar';
import { RecordRow } from '../components/RecordRow';
import { WeatherCard } from '../components/WeatherCard';
import { Empty } from '../components/ui';
import type { IconName } from '../components/icons';
import { setSetting, useRecords, useSetting, type FieldRecord } from '../db';
import { DEFAULT_PEOPLE, FARM } from '../data/farm';
import { SEASONS, monthGuide } from '../data/seasons';
import { getSpecies, usuallyFlowering, type Species } from '../data/species';
import { formatLongDate, plural } from '../lib/format';
import { install, isInstalled, isIPhone, useCanInstall } from '../lib/install';
import { isSameMonth } from '../lib/records';
import { href } from '../lib/router';
import { countDraftTotal } from './Count';

const DAY = 86_400_000;

const ACTIONS: { path: string; label: string; icon: IconName; colour: string; tint: string }[] = [
  { path: 'count', label: 'Count', icon: 'binoculars', colour: '#A94A24', tint: '#F3E1D6' },
  { path: 'sighting', label: 'Sighting', icon: 'pin', colour: '#2D6A88', tint: '#DCEAF0' },
  { path: 'plant', label: 'Plant', icon: 'flower', colour: '#8E2A5E', tint: '#F1DCE7' },
  { path: 'listen', label: 'Listen', icon: 'mic', colour: '#2D6A88', tint: '#DCEAF0' },
  { path: 'rain', label: 'Rain', icon: 'drop', colour: '#466178', tint: '#DFE6EC' },
];

/** Rain this month, and what is flowering: plants recorded flowering in the last 30 days first, then the usual ones. */
function summarise(records: FieldRecord[], now: number) {
  const today = new Date(now);
  const month = today.getMonth() + 1;
  const rain = records
    .filter((r) => r.kind === 'rain' && isSameMonth(r.at, today.getFullYear(), month))
    .reduce((sum, r) => sum + (r.mm ?? 0), 0);
  const logged = new Map<string, number>();
  for (const r of records) {
    if (r.kind === 'plant' && r.stage === 'Flowering' && r.speciesId && now - r.at < 30 * DAY) {
      logged.set(r.speciesId, (logged.get(r.speciesId) ?? 0) + 1);
    }
  }
  const fromLogs = [...logged.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ species: getSpecies(id), count }))
    .filter((x): x is { species: Species; count: number } => Boolean(x.species));
  const usual = usuallyFlowering(month)
    .filter((s) => !logged.has(s.id))
    .map((species) => ({ species, count: 0 }));
  return { rainThisMonth: Math.round(rain * 10) / 10, inFlower: [...fromLogs, ...usual], anyLogged: fromLogs.length > 0 };
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '');
}

/** Faces of everyone on the list; tap your own to choose who records on this device. */
export function WhoPicker({ current, onPick }: { current?: string; onPick: (name: string) => void }) {
  const people = useSetting<string[]>('people', DEFAULT_PEOPLE);
  function choose(person: string) {
    const clean = person.trim();
    if (clean) onPick(clean);
  }
  return (
    <div className="who__pick">
      <div className="faces" role="group" aria-label="Who is recording">
        {people.map((p) => (
          <button key={p} type="button" className="faces__item" aria-pressed={current === p} onClick={() => choose(p)}>
            <PersonAvatar name={p} size={60} active={current === p} />
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function InstallHint() {
  const dismissed = useSetting<boolean>('installHintDismissed', false);
  const canInstall = useCanInstall();
  if (dismissed || isInstalled() || (!isIPhone() && !canInstall)) return null;
  return (
    <section className="card install">
      <Icon name={canInstall ? 'download' : 'share'} size={26} />
      <div>
        <strong>Put Veldboek on your home screen</strong>
        {canInstall ? (
          <span>It then opens like an app, works without signal and keeps your records safe.</span>
        ) : (
          <span>
            Tap <b>Share</b> at the bottom of Safari, then <b>Add to Home Screen</b>. It then opens like an app and keeps your records safe.
          </span>
        )}
      </div>
      {canInstall ? (
        <button type="button" className="btn btn--primary btn--small" onClick={() => void install()}>
          Install
        </button>
      ) : (
        <button type="button" className="icon-btn" aria-label="Hide this tip" onClick={() => setSetting('installHintDismissed', true)}>
          <Icon name="close" size={18} />
        </button>
      )}
    </section>
  );
}

export function Today() {
  const records = useRecords();
  const recorder = useSetting<string>('recorder', '');
  const now = Date.now();
  const guide = monthGuide(new Date(now).getMonth() + 1);
  const season = SEASONS[guide.season];
  const draftTotal = countDraftTotal();

  const { rainThisMonth, inFlower, anyLogged } = summarise(records ?? [], now);

  // Say what was actually recorded flowering; fall back to what usually flowers this month.
  const logged = inFlower.filter((x) => x.count > 0).slice(0, 2).map((x) => x.species.en);
  const usual = inFlower.slice(0, 2).map((x) => x.species.en);
  const headline = anyLogged
    ? `${joinNames(logged)} ${logged.length > 1 ? 'are' : 'is'} flowering`
    : usual.length
      ? `${joinNames(usual)} usually ${usual.length > 1 ? 'flower' : 'flowers'} now`
      : guide.veld;
  const dots = inFlower.slice(0, 3).map((x) => x.species.colour ?? '#E7B416');
  const latest = (records ?? []).slice(0, 6);

  return (
    <div className="today">
      <header className="today__head">
        <Logo size={48} />
        <div>
          <span className="eyebrow">{formatLongDate(now)}</span>
          <h1 className="today__title">
            {FARM.name} <span>Veldboek</span>
          </h1>
        </div>
        {recorder ? (
          <a className="today__me" href={href('settings')} aria-label={`Recording as ${recorder}. Open settings`}>
            <PersonAvatar name={recorder} size={48} active />
          </a>
        ) : (
          <a className="icon-btn" href={href('settings')} aria-label="Settings">
            <Icon name="settings" size={20} />
          </a>
        )}
      </header>

      <InstallHint />
      <WeatherCard />

      {draftTotal > 0 && (
        <a className="card resume" href={href('count')}>
          <Icon name="binoculars" size={22} />
          <span>
            <strong>Count in progress</strong>
            <small>{plural(draftTotal, 'animal')} so far. Tap to carry on.</small>
          </span>
          <Icon name="next" size={20} />
        </a>
      )}

      <div className="today__grid">
        <div className="today__col">
          <a className="season-card" href={href('seasons')} style={{ '--season-bg': season.deep } as CSSProperties}>
            <svg className="season-card__art" width="170" height="150" viewBox="0 0 170 150" aria-hidden="true">
              <circle cx="128" cy="40" r="16" fill="#E3B53B" opacity="0.9" />
              <path d="M0 110 L40 78 L62 92 L96 60 L130 88 L170 70 L170 150 L0 150 Z" fill="rgba(255,255,255,0.08)" />
              <path d="M0 128 L50 108 L90 120 L130 104 L170 114 L170 150 L0 150 Z" fill="rgba(255,255,255,0.12)" />
              {dots.length > 0 &&
                [
                  [30, 134], [52, 141], [96, 132], [140, 138], [121, 145], [160, 146], [70, 137], [110, 141], [156, 130], [42, 146], [84, 146],
                ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2.4} fill={dots[i % dots.length]} />)}
            </svg>
            <span className="season-card__label">
              {guide.season} · {season.af}
            </span>
            <strong className="season-card__headline">{headline}</strong>
            <span className="season-card__sub">{guide.birds}.</span>
            <span className="season-card__rain">
              <Icon name="drop" size={14} strokeWidth={2} />
              {rainThisMonth > 0 ? `${rainThisMonth} mm rain this month` : 'No rain recorded this month'}
            </span>
          </a>

          <div className="quick">
            {ACTIONS.map((a) => (
              <a key={a.path} href={href(a.path)} className="quick__item">
                <span className="avatar" style={{ background: a.tint, color: a.colour }}>
                  <Icon name={a.icon} size={22} />
                </span>
                {a.label}
              </a>
            ))}
          </div>
        </div>

        <div className="today__col">
          <section className="section">
            <div className="section__head">
              <h2>In flower now</h2>
              <a href={href('seasons')}>Calendar</a>
            </div>
            {inFlower.length ? (
              <div className="flowers">
                {inFlower.map(({ species, count }) => (
                  <a key={species.id} className="flowers__card" href={href(`species/${species.id}`)}>
                    <span className="flowers__mark">
                      <FlowerMark colour={species.colour} />
                    </span>
                    <strong>{species.en}</strong>
                    <span className="muted">{species.af}</span>
                    <span className="flowers__count">{count ? plural(count, 'record') : 'Usually now'}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">Nothing usually flowers this month. Record what you find.</p>
            )}
          </section>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2>Latest records</h2>
          <a href={href('records')}>See all</a>
        </div>
        {latest.length ? (
          <div className="card row-list">
            {latest.map((r) => (
              <RecordRow key={r.id} record={r} showDay />
            ))}
          </div>
        ) : (
          <Empty icon="binoculars" title="Nothing recorded yet">
            Start with a Quick count: tap the big + below.
          </Empty>
        )}
      </section>
    </div>
  );
}
