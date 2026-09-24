import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { WhoPicker } from './Today';
import { setSetting, useRecords, useSetting } from '../db';
import { DEFAULT_CAMPS, FARM } from '../data/farm';
import { plural } from '../lib/format';
import { install, useCanInstall } from '../lib/install';

function EditableList({ items, onChange, addLabel, placeholder }: { items: string[]; onChange: (items: string[]) => void; addLabel: string; placeholder: string }) {
  const [value, setValue] = useState('');
  function add() {
    const clean = value.trim();
    if (!clean || items.includes(clean)) return;
    onChange([...items, clean]);
    setValue('');
  }
  return (
    <div className="editable">
      {items.map((item) => (
        <div key={item} className="editable__row">
          <span>{item}</span>
          <button
            type="button"
            className="icon-btn icon-btn--plain"
            aria-label={`Remove ${item}`}
            onClick={() => window.confirm(`Remove ${item} from the list? Old records keep it.`) && onChange(items.filter((i) => i !== item))}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      ))}
      <form
        className="editable__add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="input" placeholder={placeholder} aria-label={addLabel} value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="submit" className="btn btn--small">
          <Icon name="plus" size={18} />
          Add
        </button>
      </form>
    </div>
  );
}

function useStorageInfo() {
  const [info, setInfo] = useState<{ usedMb?: number; persisted?: boolean }>({});
  useEffect(() => {
    void (async () => {
      const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
      const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
      setInfo({ usedMb: estimate?.usage !== undefined ? Math.round((estimate.usage / 1_048_576) * 10) / 10 : undefined, persisted });
    })();
  }, []);
  return info;
}

export function Settings() {
  const recorder = useSetting<string>('recorder', '');
  const camps = useSetting<string[]>('camps', DEFAULT_CAMPS);
  const records = useRecords();
  const storage = useStorageInfo();
  const canInstall = useCanInstall();

  return (
    <>
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <section className="card settings-block">
        <h2>Who is recording on this device</h2>
        <p className="muted">Tap your face. Every record shows who made it.</p>
        <WhoPicker current={recorder} onPick={(name) => setSetting('recorder', name)} />
      </section>

      <section className="card settings-block">
        <h2>Camps</h2>
        <p className="muted">These are placeholders until the real kampe are entered. Removing one does not change old records.</p>
        <EditableList items={camps} onChange={(next) => setSetting('camps', next)} addLabel="Add a camp" placeholder="Camp name" />
      </section>

      <section className="card settings-block">
        <h2>Install the app</h2>
        {canInstall && (
          <button type="button" className="btn btn--primary" onClick={() => void install()}>
            <Icon name="download" size={20} />
            Install Veldboek on this device
          </button>
        )}
        <h3>iPhone</h3>
        <ol className="steps">
          <li>
            Open this page in <b>Safari</b>.
          </li>
          <li>
            Tap <b>Share</b> (the square with the arrow).
          </li>
          <li>
            Tap <b>Add to Home Screen</b>, then <b>Add</b>.
          </li>
        </ol>
        <h3>Android (Samsung and others)</h3>
        <ol className="steps">
          <li>
            Open this page in <b>Chrome</b>.
          </li>
          <li>
            Tap the <b>⋮</b> menu at the top right.
          </li>
          <li>
            Tap <b>Install app</b> or <b>Add to Home screen</b>.
          </li>
        </ol>
        <p className="muted">The app then opens full screen, works without signal, and the phone keeps its records safe.</p>
      </section>

      <section className="card settings-block about">
        <Logo size={56} />
        <div>
          <strong>
            {FARM.name} Veldboek {__APP_VERSION__}
          </strong>
          <span className="muted">
            {plural(records?.length ?? 0, 'record')} on this device
            {storage.usedMb !== undefined ? ` · ${storage.usedMb} MB used` : ''}
            {storage.persisted ? ' · protected storage' : ''}
          </span>
        </div>
      </section>
    </>
  );
}
