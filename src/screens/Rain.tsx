import { useState } from 'react';
import { Icon } from '../components/Icon';
import { ActionBar, Field, TopBar } from '../components/ui';
import { saveRecords, uid, useSetting } from '../db';
import { toDateInput } from '../lib/format';
import { moonPhase } from '../lib/moon';
import { go } from '../lib/router';
import { toast } from '../lib/toast';

/** Rain gauges are usually read in the morning; a reading for an earlier day is stored at 08:00. */
function readingTime(date: string): number {
  if (date === toDateInput(Date.now())) return Date.now();
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 8, 0).getTime();
}

export function Rain() {
  const recorder = useSetting<string>('recorder', '');
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const [mm, setMm] = useState('');
  const [place, setPlace] = useState('Rain gauge at the house');
  const [saving, setSaving] = useState(false);

  async function save() {
    const value = Number(mm.replace(',', '.'));
    if (!mm || !Number.isFinite(value) || value < 0) {
      toast('Enter the rain in millimetres');
      return;
    }
    setSaving(true);
    const at = readingTime(date);
    try {
      await saveRecords([
        { id: uid(), kind: 'rain', at, by: recorder || 'Unknown', mm: value, camp: place.trim() || undefined, moon: moonPhase(new Date(at)), updatedAt: Date.now() },
      ]);
      toast(`Saved ${value} mm rain`);
      go('');
    } catch {
      toast('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Rain" subtitle="Reading from the rain gauge" />
      <Field label="Millimetres">
        <div className="rain-input">
          <input
            className="input"
            inputMode="decimal"
            placeholder="0"
            aria-label="Rain in millimetres"
            value={mm}
            onChange={(e) => setMm(e.target.value.replace(/[^0-9.,]/g, ''))}
            autoFocus
          />
          <span>mm</span>
        </div>
      </Field>
      <Field label="Day">
        <input className="input" type="date" value={date} max={toDateInput(Date.now())} onChange={(e) => setDate(e.target.value || toDateInput(Date.now()))} />
      </Field>
      <Field label="Gauge">
        <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} />
      </Field>
      <ActionBar>
        <button type="button" className="btn btn--primary btn--grow" onClick={save} disabled={saving}>
          <Icon name="check" size={20} strokeWidth={2.4} />
          Save rain
        </button>
      </ActionBar>
    </>
  );
}
