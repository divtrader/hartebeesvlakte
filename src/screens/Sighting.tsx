import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PlaceCard } from '../components/PlaceCard';
import { PhotoStrip } from '../components/PhotoStrip';
import { SpeciesPicker } from '../components/SpeciesPicker';
import { ActionBar, Field, Stepper, TopBar } from '../components/ui';
import { saveRecords, uid, useRecords } from '../db';
import { ANIMAL_GROUPS, getSpecies } from '../data/species';
import { useFieldContext, useFormPhotos } from '../lib/fieldContext';
import { usageBySpecies } from '../lib/records';
import { go, routeParam } from '../lib/router';
import { toast } from '../lib/toast';

export function Sighting() {
  const ctx = useFieldContext();
  const records = useRecords();
  const usage = useMemo(() => usageBySpecies(records ?? []), [records]);
  const [speciesId, setSpeciesId] = useState(() => (getSpecies(routeParam('species')) ? routeParam('species') : undefined));
  const [n, setN] = useState(1);
  const [note, setNote] = useState('');
  const [photoIds, setPhotoIds, markSaved] = useFormPhotos();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!speciesId) {
      toast('Choose what you saw first');
      return;
    }
    setSaving(true);
    const base = ctx.base();
    try {
      await saveRecords([
        {
          ...base,
          id: uid(),
          kind: 'animal',
          speciesId,
          n,
          note: note.trim() || undefined,
          photoIds: photoIds.length ? photoIds : undefined,
          updatedAt: base.at,
        },
      ]);
      markSaved();
      toast(`Saved: ${getSpecies(speciesId)?.en ?? 'sighting'}`);
      go('');
    } catch {
      toast('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Sighting" subtitle="One animal or group, with a photo" />
      <PlaceCard gps={ctx.gps} retry={ctx.retry} camp={ctx.camp} camps={ctx.camps} onCamp={ctx.setCamp} />
      <Field label="What did you see?">
        <SpeciesPicker groups={ANIMAL_GROUPS} value={speciesId} onChange={setSpeciesId} usage={usage} colour="#A94A24" />
      </Field>
      <Field label="How many?">
        <Stepper value={n} onChange={setN} label="Number of animals" />
      </Field>
      <Field label="Photos">
        <PhotoStrip ids={photoIds} onChange={setPhotoIds} />
      </Field>
      <Field label="Note" hint="Optional. Behaviour, young ones, tracks, anything worth remembering.">
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <ActionBar>
        <button type="button" className="btn btn--primary btn--grow" onClick={save} disabled={saving}>
          <Icon name="check" size={20} strokeWidth={2.4} />
          Save sighting
        </button>
      </ActionBar>
    </>
  );
}
