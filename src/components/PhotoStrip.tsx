import { useState, type ChangeEvent } from 'react';
import { Icon } from './Icon';
import { db } from '../db';
import { storePhotos, usePhotoUrl } from '../lib/photos';
import { toast } from '../lib/toast';

function Thumb({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const url = usePhotoUrl(id);
  return (
    <span className="photos__thumb">
      {url && <img src={url} alt="" />}
      {onRemove && (
        <button type="button" className="photos__remove" aria-label="Remove photo" onClick={onRemove}>
          <Icon name="close" size={14} strokeWidth={2.4} />
        </button>
      )}
    </span>
  );
}

/** Photos for a record being made. Photos are stored straight away, so nothing is lost if the phone locks. */
export function PhotoStrip({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [busy, setBusy] = useState(false);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    setBusy(true);
    try {
      onChange([...ids, ...(await storePhotos(files))]);
    } catch {
      toast('The photo could not be saved');
    } finally {
      setBusy(false);
      input.value = '';
    }
  }

  async function remove(id: string) {
    onChange(ids.filter((x) => x !== id));
    await db.photos.delete(id);
  }

  return (
    <div className="photos">
      {ids.map((id) => (
        <Thumb key={id} id={id} onRemove={() => remove(id)} />
      ))}
      <label className="photos__add">
        <Icon name="camera" size={24} />
        <span>{busy ? 'Saving' : ids.length ? 'Add' : 'Add photo'}</span>
        <input type="file" accept="image/*" multiple className="visually-hidden" onChange={onFiles} />
      </label>
    </div>
  );
}

/** Read only row of photos for a saved record. */
export function PhotoRow({ ids }: { ids: string[] }) {
  return (
    <div className="photos photos--view">
      {ids.map((id) => (
        <Thumb key={id} id={id} />
      ))}
    </div>
  );
}
