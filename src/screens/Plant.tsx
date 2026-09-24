import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PlaceCard } from '../components/PlaceCard';
import { PhotoStrip } from '../components/PhotoStrip';
import { SpeciesPicker } from '../components/SpeciesPicker';
import { ActionBar, Chips, Field, TopBar } from '../components/ui';
import { AMOUNTS, STAGES, saveRecords, uid, useRecords, type Amount, type Stage } from '../db';
import { getSpecies } from '../data/species';
import { useFieldContext, useFormPhotos } from '../lib/fieldContext';
import { usageBySpecies } from '../lib/records';
import { go, routeParam } from '../lib/router';
import { toast } from '../lib/toast';

const FLORA = '#8E2A5E';

const COLOURS: [string, string][] = [
  ['White', '#F7F3EA'],
  ['Yellow', '#E7B416'],
  ['Orange', '#E07A2E'],
  ['Pink', '#D9669B'],
  ['Purple', '#7B4FA8'],
  ['Red', '#C0392B'],
  ['Blue', '#3F6FB5'],
];

export function Plant() {
  const ctx = useFieldContext();
  const records = useRecords();
  const usage = useMemo(() => usageBySpecies(records ?? []), [records]);
  const [speciesId, setSpeciesId] = useState(() => (getSpecies(routeParam('species')) ? routeParam('species') : undefined));
  const [stage, setStage] = useState<Stage>('Flowering');
  const [amount, setAmount] = useState<Amount>('A few');
  const [colour, setColour] = useState<string>();
  const [photoPoint, setPhotoPoint] = useState(false);
  const [note, setNote] = useState('');
  const [photoIds, setPhotoIds, markSaved] = useFormPhotos();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!speciesId) {
      toast('Choose the plant, or Unknown plant');
      return;
    }
    setSaving(true);
    const base = ctx.base();
    try {
      await saveRecords([
        {
          ...base,
          id: uid(),
          kind: 'plant',
          speciesId,
          stage,
          amount,
          colour: stage === 'Flowering' ? colour : undefined,
          photoPoint: photoPoint || undefined,
          note: note.trim() || undefined,
          photoIds: photoIds.length ? photoIds : undefined,
          updatedAt: base.at,
        },
      ]);
      markSaved();
      toast(`Saved: ${getSpecies(speciesId)?.en ?? 'plant'}`);
      go('');
    } catch {
      toast('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Plant record" subtitle="What is flowering, and where" />
      <Field label="Photos">
        <PhotoStrip ids={photoIds} onChange={setPhotoIds} />
      </Field>
      <Field label="Plant" hint="Not sure what it is? Choose Unknown plant and name it later.">
        <SpeciesPicker groups={['plants']} value={speciesId} onChange={setSpeciesId} usage={usage} colour={FLORA} />
      </Field>
      <Field label="What is it doing?">
        <Chips label="Stage" options={STAGES} value={stage} onChange={setStage} colour={FLORA} />
      </Field>
      <Field label="How many plants?">
        <Chips label="How many" options={AMOUNTS} value={amount} onChange={setAmount} colour={FLORA} />
      </Field>
      {stage === 'Flowering' && (
        <Field label={`Flower colour${colour ? ` · ${colour}` : ''}`}>
          <div className="swatches" role="group" aria-label="Flower colour">
            {COLOURS.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={colour === name}
                onClick={() => setColour(colour === name ? undefined : name)}
              >
                <span style={{ background: hex }} />
              </button>
            ))}
          </div>
        </Field>
      )}
      <PlaceCard gps={ctx.gps} retry={ctx.retry} camp={ctx.camp} camps={ctx.camps} onCamp={ctx.setCamp} />
      <div className="switch-row card">
        <span>
          <strong>Make this a photo point</strong>
          <small>Take the same photo here every season to see the veld change</small>
        </span>
        <button type="button" role="switch" aria-checked={photoPoint} aria-label="Make this a photo point" onClick={() => setPhotoPoint((v) => !v)} className="switch">
          <span />
        </button>
      </div>
      <Field label="Note" hint="Optional.">
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <ActionBar>
        <button type="button" className="btn btn--primary btn--grow" onClick={save} disabled={saving}>
          <Icon name="check" size={20} strokeWidth={2.4} />
          Save plant record
        </button>
      </ActionBar>
    </>
  );
}
