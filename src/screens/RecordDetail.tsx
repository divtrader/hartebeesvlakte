import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipPlayer } from '../components/ClipPlayer';
import { Icon } from '../components/Icon';
import { PersonAvatar } from '../components/PersonAvatar';
import { PhotoRow } from '../components/PhotoStrip';
import { SpeciesPicker } from '../components/SpeciesPicker';
import { ActionBar, Chips, Empty, Field, SpeciesThumb, Stepper, TopBar } from '../components/ui';
import { AMOUNTS, STAGES, db, deleteRecord, useRecords, useSetting, type Amount, type FieldRecord, type Stage } from '../db';
import { DEFAULT_CAMPS } from '../data/farm';
import { ANIMAL_GROUPS, getSpecies, type Group } from '../data/species';
import { formatDay, formatTime, toDateInput } from '../lib/format';
import { moonPhase } from '../lib/moon';
import { recordTitle, usageBySpecies } from '../lib/records';
import { goBack, href } from '../lib/router';
import { toast } from '../lib/toast';
import { FLORA, FlowerColours } from './Plant';

/** The same time of day, on another day chosen with a date input. */
function onDay(ts: number, date: string): number {
  const d = new Date(ts);
  const [y, m, day] = date.split('-').map(Number);
  d.setFullYear(y, m - 1, day);
  return d.getTime();
}

/** Who recorded it, or undefined for old records made before anyone was chosen. */
function recordedBy(r: FieldRecord): string | undefined {
  return r.by && r.by !== 'Unknown' ? r.by : undefined;
}

/** One saved record. The person who recorded it can correct it, such as the count, or delete it. */
export function RecordDetail({ id }: { id: string }) {
  // null while loading, undefined when there is no such record.
  const record = useLiveQuery(() => db.records.get(id), [id], null);
  if (record === null) return null;
  if (!record) {
    return (
      <>
        <TopBar title="Record" onBack={() => goBack('records')} />
        <Empty icon="list" title="This record is not here">
          It was deleted, or made on another phone.
        </Empty>
      </>
    );
  }
  return <RecordForm record={record} />;
}

function RecordForm({ record }: { record: FieldRecord }) {
  const recorder = useSetting<string>('recorder', '');
  const camps = useSetting<string[]>('camps', DEFAULT_CAMPS);
  const records = useRecords();
  const usage = useMemo(() => usageBySpecies(records ?? []), [records]);
  const by = recordedBy(record);
  const canEdit = !by || by === recorder;
  const heard = record.source === 'sound';

  const [speciesId, setSpeciesId] = useState(record.speciesId);
  const [n, setN] = useState(record.n ?? 1);
  const [stage, setStage] = useState<Stage>(record.stage ?? 'Flowering');
  const [amount, setAmount] = useState<Amount | undefined>(record.amount);
  const [colour, setColour] = useState(record.colour);
  const [camp, setCamp] = useState(record.camp ?? '');
  const [note, setNote] = useState(record.note ?? '');
  const [mm, setMm] = useState(record.mm === undefined ? '' : String(record.mm));
  const [day, setDay] = useState(() => toDateInput(record.at));
  const [saving, setSaving] = useState(false);

  const species = getSpecies(record.speciesId);
  const groups: Group[] = record.kind === 'plant' ? ['plants'] : heard ? ['birds'] : ANIMAL_GROUPS;
  const campOptions = record.camp && !camps.includes(record.camp) ? [record.camp, ...camps] : camps;
  const when = `${formatDay(record.at)} at ${formatTime(record.at)}`;

  async function save() {
    const changes: Partial<FieldRecord> = { camp: camp.trim() || undefined, note: note.trim() || undefined, updatedAt: Date.now() };
    if (record.kind === 'rain') {
      const value = Number(mm.replace(',', '.'));
      if (!mm || !Number.isFinite(value) || value < 0) {
        toast('Enter the rain in millimetres');
        return;
      }
      changes.mm = value;
      if (day !== toDateInput(record.at)) {
        changes.at = onDay(record.at, day);
        changes.moon = moonPhase(new Date(changes.at));
      }
    } else {
      changes.speciesId = speciesId;
      if (record.kind === 'animal' && !heard) changes.n = n;
      if (record.kind === 'plant') {
        changes.stage = stage;
        changes.amount = amount;
        changes.colour = stage === 'Flowering' ? colour : undefined;
      }
    }
    setSaving(true);
    try {
      await db.records.update(record.id, changes);
      toast('Changes saved');
      goBack('records');
    } catch {
      toast('Could not save. Try again.');
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete this record: ${recordTitle(record)}? This cannot be undone.`)) return;
    goBack('records');
    await deleteRecord(record.id);
    toast('Record deleted');
  }

  const about = species && (
    <a className="icon-btn" href={href(`species/${species.id}`)} aria-label={`About the ${species.en}`}>
      <Icon name="book" size={20} />
    </a>
  );

  const who = (
    <div className="record-who card">
      {by ? <PersonAvatar name={by} size={44} /> : <span className="record-who__nobody" />}
      <div>
        <strong>{by ?? 'Nobody chosen'}</strong>
        <span>
          {when}
          {record.lat !== undefined && ` · GPS to ${record.acc ?? '?'} m`}
        </span>
      </div>
    </div>
  );

  const extras = (
    <>
      {heard && record.clipId && (
        <Field label={`Heard by BirdNET · ${Math.round((record.confidence ?? 0) * 100)}% sure`}>
          <ClipPlayer id={record.clipId} />
        </Field>
      )}
      {record.photoIds?.length ? (
        <Field label="Photos">
          <PhotoRow ids={record.photoIds} />
        </Field>
      ) : null}
    </>
  );

  if (!canEdit) {
    const facts: [string, string | undefined][] = [
      ['How many', record.kind === 'animal' && !heard ? String(record.n ?? 1) : undefined],
      ['Stage', record.stage],
      ['How many plants', record.amount],
      ['Flower colour', record.colour],
      ['Rain', record.kind === 'rain' ? `${record.mm ?? 0} mm` : undefined],
      [record.kind === 'rain' ? 'Gauge' : 'Camp', record.camp],
    ];
    return (
      <>
        <TopBar title={recordTitle(record)} onBack={() => goBack('records')} />
        {who}
        {species && (
          <a className="picked card" href={href(`species/${species.id}`)}>
            <SpeciesThumb species={species} size={44} />
            <div className="picked__text">
              <strong>{species.en}</strong>
              <span>{species.af}</span>
            </div>
            <Icon name="next" size={18} />
          </a>
        )}
        <dl className="facts card">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
        {record.note && (
          <Field label="Note">
            <p className="record-note">{record.note}</p>
          </Field>
        )}
        {extras}
        <p className="record-owner">Only {by} can change or delete this record.</p>
      </>
    );
  }

  return (
    <>
      <TopBar title={recordTitle(record)} onBack={() => goBack('records')} right={about} />
      {who}

      {record.kind === 'rain' ? (
        <>
          <Field label="Millimetres">
            <div className="rain-input">
              <input
                className="input"
                inputMode="decimal"
                placeholder="0"
                aria-label="Rain in millimetres"
                value={mm}
                onChange={(e) => setMm(e.target.value.replace(/[^0-9.,]/g, ''))}
              />
              <span>mm</span>
            </div>
          </Field>
          <Field label="Day">
            <input className="input" type="date" value={day} max={toDateInput(Date.now())} onChange={(e) => setDay(e.target.value || toDateInput(record.at))} />
          </Field>
          <Field label="Gauge">
            <input className="input" value={camp} onChange={(e) => setCamp(e.target.value)} />
          </Field>
        </>
      ) : (
        <>
          <Field label={record.kind === 'plant' ? 'Plant' : heard ? 'Bird' : 'Animal'}>
            <SpeciesPicker groups={groups} value={speciesId} onChange={setSpeciesId} usage={usage} colour={record.kind === 'plant' ? FLORA : '#A94A24'} />
          </Field>
          {record.kind === 'animal' && !heard && (
            <Field label="How many?">
              <Stepper value={n} onChange={setN} label="Number of animals" />
            </Field>
          )}
          {record.kind === 'plant' && (
            <>
              <Field label="What is it doing?">
                <Chips label="Stage" options={STAGES} value={stage} onChange={setStage} colour={FLORA} />
              </Field>
              <Field label="How many plants?">
                <Chips label="How many" options={AMOUNTS} value={amount} onChange={setAmount} colour={FLORA} />
              </Field>
              {stage === 'Flowering' && <FlowerColours value={colour} onChange={setColour} />}
            </>
          )}
          <Field label="Camp">
            <select className="input input--select" value={camp} onChange={(e) => setCamp(e.target.value)}>
              {!record.camp && <option value="">No camp</option>}
              {campOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label="Note" hint="Optional.">
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {extras}

      <button type="button" className="btn btn--ghost btn--danger record-delete" onClick={remove}>
        <Icon name="trash" size={18} />
        Delete this record
      </button>

      <ActionBar>
        <button type="button" className="btn btn--primary btn--grow" onClick={save} disabled={saving}>
          <Icon name="check" size={20} strokeWidth={2.4} />
          Save changes
        </button>
      </ActionBar>
    </>
  );
}
