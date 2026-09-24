import { Icon } from './Icon';
import { portionAt } from '../data/boundary';
import type { GpsState } from '../lib/gps';

interface Props {
  gps: GpsState;
  retry: () => void;
  camp: string;
  camps: string[];
  onCamp: (camp: string) => void;
}

/** Where the record is made: the camp, plus the GPS position when the phone has one. */
export function PlaceCard({ gps, retry, camp, camps, onCamp }: Props) {
  const status =
    gps.status === 'found'
      ? `GPS found · accurate to ${gps.pos.acc} m · ${portionAt(gps.pos.lat, gps.pos.lng)?.name ?? 'outside the farm'}`
      : gps.status === 'finding'
        ? 'Finding your position'
        : `${gps.message}. The record still saves.`;
  return (
    <div className="place card">
      <span className="avatar" style={{ background: '#DCEAF0', color: '#2D6A88' }}>
        <Icon name="pin" size={21} />
      </span>
      <div className="place__text">
        <label className="place__camp">
          <span className="visually-hidden">Camp</span>
          <select value={camp} onChange={(e) => onCamp(e.target.value)}>
            {camps.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Icon name="next" size={16} className="place__chevron" />
        </label>
        <span className={`place__gps place__gps--${gps.status}`}>{status}</span>
      </div>
      {gps.status === 'failed' && (
        <button type="button" className="btn btn--ghost btn--small" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
