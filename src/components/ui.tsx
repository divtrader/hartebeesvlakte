import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { GROUPS, type Group, type Species } from '../data/species';
import { useSpeciesMedia } from '../lib/speciesMedia';

export function TopBar({ title, subtitle, backTo = '', right }: { title: string; subtitle?: string; backTo?: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      <a className="icon-btn" href={`#/${backTo}`} aria-label="Back">
        <Icon name="back" />
      </a>
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="topbar__right">{right}</div>
    </header>
  );
}

export function Avatar({ icon, colour, tint, size = 40 }: { icon: IconName; colour: string; tint: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: tint, color: colour, width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.55)} />
    </span>
  );
}

export function GroupAvatar({ group, size }: { group: Group; size?: number }) {
  const g = GROUPS[group];
  return <Avatar icon={g.icon} colour={g.colour} tint={g.tint} size={size} />;
}

/** Round photo of the species, so it is easy to recognise; the group icon when there is no photo. */
export function SpeciesThumb({ species, size = 40 }: { species: Species; size?: number }) {
  const photo = useSpeciesMedia(species).small;
  if (!photo) return <GroupAvatar group={species.group} size={size} />;
  return (
    <span className="thumb" style={{ width: size, height: size, borderColor: GROUPS[species.group].tint }}>
      <img src={photo} alt="" loading="lazy" draggable={false} />
    </span>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  colour,
  label,
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  colour?: string;
  label: string;
}) {
  return (
    <div className="chips" role="group" aria-label={label} style={colour ? ({ '--chip-on': colour } as CSSProperties) : undefined}>
      {options.map((option) => (
        <button key={option} type="button" className="chip" aria-pressed={option === value} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="actionbar">
      <div className="actionbar__inner">{children}</div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}
