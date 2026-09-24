import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Chips, SpeciesThumb, TopBar } from '../components/ui';
import { db, saveRecords, uid } from '../db';
import { FARM } from '../data/farm';
import { getSpecies, registerSpecies, speciesForBirdnet } from '../data/species';
import { BirdListener, SAMPLE_RATE, type WindowResult } from '../birdnet/listener';
import { MODEL_BYTES, downloadModel, isModelDownloaded, modelUrl } from '../birdnet/files';
import { birdnetWeek } from '../birdnet/protocol';
import { useFieldContext } from '../lib/fieldContext';
import { formatTime } from '../lib/format';
import { encodeWav } from '../lib/wav';
import { toast } from '../lib/toast';

type Phase = 'checking' | 'download' | 'downloading' | 'loading' | 'ready' | 'listening' | 'error';

const LEVELS = { Sure: 0.6, Likely: 0.35, Possible: 0.15 } as const;
type Level = keyof typeof LEVELS;
const LEVEL_NAMES = Object.keys(LEVELS) as Level[];

/** How likely a species must be at this place and week to count as expected (BirdNET's own default). */
const EXPECTED = 0.03;

interface Detection {
  sci: string;
  en: string;
  af: string;
  best: number;
  geo: number;
  heard: number;
  lastAt: number;
  clip: Float32Array;
  savedId?: string;
}

// BirdNET also recognises people, dogs, engines and other noise; those are not birds.
function isSpecies(sci: string, en: string): boolean {
  return sci.includes(' ') && sci !== en;
}

function microphoneMessage(error: unknown): string {
  const name = (error as DOMException | undefined)?.name;
  if (name === 'NotAllowedError') return 'The microphone is blocked. Allow it for this app, then try again.';
  if (name === 'NotFoundError') return 'No microphone found on this device.';
  return error instanceof Error ? error.message : 'Could not start listening.';
}

function play(clip: Float32Array) {
  const url = URL.createObjectURL(encodeWav(clip, SAMPLE_RATE));
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  void audio.play();
}

export function Listen() {
  const ctx = useFieldContext();
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [levels, setLevels] = useState<number[]>(() => Array(24).fill(0));
  const [onlyExpected, setOnlyExpected] = useState(true);
  const [threshold, setThreshold] = useState<Level>('Likely');
  const [expected, setExpected] = useState<number>();
  const [detections, setDetections] = useState<Record<string, Detection>>({});
  const [startedAt, setStartedAt] = useState<number>();
  const [now, setNow] = useState(Date.now());
  const [slow, setSlow] = useState(false);
  const listener = useRef<BirdListener | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const lastLevel = useRef(0);

  function merge({ hits, pcm }: WindowResult) {
    const at = Date.now();
    setDetections((prev) => {
      const next = { ...prev };
      for (const hit of hits) {
        if (!isSpecies(hit.sci, hit.en) || hit.score < LEVELS.Possible) continue;
        const old = next[hit.sci];
        const better = !old || hit.score > old.best;
        next[hit.sci] = {
          sci: hit.sci,
          en: hit.en,
          af: hit.af,
          geo: hit.geo,
          best: better ? hit.score : old.best,
          clip: better ? pcm : old.clip,
          heard: (old?.heard ?? 0) + 1,
          lastAt: at,
          savedId: old?.savedId,
        };
      }
      return next;
    });
  }

  async function prepare() {
    setPhase('loading');
    setProgress(0);
    if (!listener.current) {
      const l = new BirdListener();
      l.on({
        onProgress: setProgress,
        onResult: merge,
        onError: (message) => setError(message),
        onLevel: (level) => {
          const t = performance.now();
          if (t - lastLevel.current < 80) return;
          lastLevel.current = t;
          setLevels((prev) => [...prev.slice(1), Math.min(1, level * 6)]);
        },
      });
      listener.current = l;
    }
    try {
      const info = await listener.current.load(modelUrl());
      setSlow(info.backend !== 'webgl');
      if (info.hasArea) {
        const pos = ctx.gps.status === 'found' ? ctx.gps.pos : { lat: FARM.centre[0], lng: FARM.centre[1] };
        setExpected(await listener.current.setPlace(pos.lat, pos.lng, birdnetWeek(new Date())));
      }
      setPhase('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The bird model could not load');
      setPhase('error');
    }
  }

  useEffect(() => {
    let alive = true;
    void isModelDownloaded().then((done) => {
      if (!alive) return;
      if (done) void prepare();
      else setPhase('download');
    });
    return () => {
      alive = false;
      listener.current?.dispose();
      listener.current = null;
      void wakeLock.current?.release();
    };
    // Runs once when the screen opens.
  }, []);

  useEffect(() => {
    if (phase !== 'listening') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  async function download() {
    setError(undefined);
    setPhase('downloading');
    try {
      await downloadModel(setProgress);
      await prepare();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
      setPhase('download');
    }
  }

  async function start() {
    if (!listener.current) return;
    setError(undefined);
    try {
      await listener.current.start();
      try {
        wakeLock.current = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        wakeLock.current = null;
      }
      setStartedAt(Date.now());
      setNow(Date.now());
      setPhase('listening');
    } catch (e) {
      listener.current.stop();
      setError(microphoneMessage(e));
      setPhase('ready');
    }
  }

  function stop() {
    listener.current?.stop();
    void wakeLock.current?.release();
    wakeLock.current = null;
    setLevels(Array(24).fill(0));
    setPhase('ready');
  }

  async function save(d: Detection) {
    const species = speciesForBirdnet(d.sci, d.en, d.af);
    if (!getSpecies(species.id)) {
      await db.species.put(species);
      registerSpecies([species]);
    }
    const clipId = uid();
    await db.clips.put({ id: clipId, blob: encodeWav(d.clip, SAMPLE_RATE), at: Date.now() });
    const id = uid();
    const base = ctx.base(d.lastAt);
    await saveRecords([
      { ...base, id, kind: 'animal', speciesId: species.id, n: 1, source: 'sound', confidence: Math.round(d.best * 100) / 100, clipId, updatedAt: Date.now() },
    ]);
    setDetections((prev) => ({ ...prev, [d.sci]: { ...prev[d.sci], savedId: id } }));
    toast(`Saved: ${species.en}`);
  }

  const shown = Object.values(detections)
    .filter((d) => d.best >= LEVELS[threshold] && (!onlyExpected || expected === undefined || expected < 0 || d.geo >= EXPECTED))
    .sort((a, b) => b.best - a.best);
  const hiddenUnexpected = onlyExpected ? Object.values(detections).filter((d) => d.best >= LEVELS[threshold] && d.geo < EXPECTED).length : 0;
  const seconds = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const listening = phase === 'listening';

  return (
    <>
      <TopBar title="Bird sounds" subtitle="Name birds from their calls" />

      {(phase === 'download' || phase === 'downloading') && (
        <section className="card listen-download">
          <span className="avatar" style={{ background: '#DCEAF0', color: '#2D6A88', width: 56, height: 56 }}>
            <Icon name="mic" size={28} />
          </span>
          <h2>One download, then it works without signal</h2>
          <p className="muted">
            The bird sound model knows more than 6,000 species and is {Math.round(MODEL_BYTES / 1_000_000)} MB. Download it once, preferably on Wi-Fi.
          </p>
          {phase === 'downloading' ? (
            <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          ) : (
            <button type="button" className="btn btn--primary" onClick={download}>
              <Icon name="download" size={20} />
              Download bird sounds
            </button>
          )}
          {phase === 'downloading' && <span className="muted">Downloading {Math.round(progress * 100)}%</span>}
        </section>
      )}

      {(phase === 'loading' || phase === 'ready' || phase === 'listening' || phase === 'error') && (
        <section className="card listen">
          <button
            type="button"
            className="listen__btn"
            data-on={listening}
            disabled={phase === 'loading' || phase === 'error'}
            onClick={listening ? stop : start}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            <Icon name={listening ? 'stop' : 'mic'} size={38} strokeWidth={2} />
          </button>
          <strong className="listen__status">
            {phase === 'loading'
              ? `Preparing the bird model ${Math.round(progress * 100)}%`
              : listening
                ? `Listening · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
                : phase === 'error'
                  ? 'Bird sounds are not available'
                  : 'Tap to start listening'}
          </strong>
          <div className="meter" aria-hidden="true">
            {levels.map((l, i) => (
              <span key={i} style={{ height: `${8 + l * 92}%` }} />
            ))}
          </div>
          <span className="listen__hint">
            {listening ? 'Point the phone at the bird and keep still.' : 'The screen stays on while listening.'}
            {slow && ' This phone runs the model slowly, so results take longer.'}
          </span>
        </section>
      )}

      {error && (
        <p className="listen__error" role="alert">
          {error}
        </p>
      )}

      {phase !== 'checking' && phase !== 'download' && phase !== 'downloading' && (
        <>
          <div className="switch-row card">
            <span>
              <strong>Only birds expected here now</strong>
              <small>
                {expected && expected > 0
                  ? `BirdNET expects ${expected} species at ${FARM.name} in week ${birdnetWeek(new Date())} of 48`
                  : 'Uses the farm position and the time of year'}
              </small>
            </span>
            <button type="button" role="switch" aria-checked={onlyExpected} aria-label="Only birds expected here now" className="switch" onClick={() => setOnlyExpected((v) => !v)}>
              <span />
            </button>
          </div>
          <Chips label="How sure" options={LEVEL_NAMES} value={threshold} onChange={setThreshold} colour="#2D6A88" />
        </>
      )}

      {(phase === 'listening' || shown.length > 0) && (
        <section className="section">
          <h2>Heard</h2>
          {shown.length ? (
            <div className="card row-list">
              {shown.map((d) => {
                const species = speciesForBirdnet(d.sci, d.en, d.af);
                return (
                  <div key={d.sci} className="heard">
                    <SpeciesThumb species={species} size={48} />
                    <div className="heard__text">
                      <strong>{species.en}</strong>
                      <span>{species.af !== species.en ? species.af : <i>{d.sci}</i>}</span>
                      <span className="heard__bar" aria-label={`${Math.round(d.best * 100)} percent sure`}>
                        <i style={{ width: `${d.best * 100}%` }} />
                      </span>
                      <small>
                        {Math.round(d.best * 100)}% sure · heard {d.heard}× · {formatTime(d.lastAt)}
                        {d.geo < EXPECTED ? ' · not expected here' : ''}
                      </small>
                    </div>
                    <button type="button" className="icon-btn" aria-label={`Play the call of ${species.en}`} onClick={() => play(d.clip)}>
                      <Icon name="play" size={18} />
                    </button>
                    {d.savedId ? (
                      <span className="heard__saved">
                        <Icon name="check" size={18} strokeWidth={2.4} />
                        Saved
                      </span>
                    ) : (
                      <button type="button" className="btn btn--small btn--primary" onClick={() => save(d)}>
                        Save
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Nothing identified yet. Birds show here within a few seconds of calling.</p>
          )}
          {hiddenUnexpected > 0 && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setOnlyExpected(false)}>
              Show {hiddenUnexpected} more that are not expected here
            </button>
          )}
        </section>
      )}

      <p className="credit">
        Bird sound identification by{' '}
        <a href="https://birdnet.cornell.edu/" target="_blank" rel="noreferrer">
          BirdNET
        </a>{' '}
        (K. Lisa Yang Center for Conservation Bioacoustics at the Cornell Lab of Ornithology, and Chemnitz University of Technology). Model V2.4,{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">
          CC BY-NC-SA 4.0
        </a>
        , for non commercial use. The model can be wrong: listen to the recording before you rely on it. iPhone asks for the microphone each time the app opens.
      </p>
    </>
  );
}
