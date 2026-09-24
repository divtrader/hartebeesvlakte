import { Icon } from './Icon';
import { Logo } from './Logo';
import { PersonAvatar } from './PersonAvatar';
import type { IconName } from './icons';
import { href } from '../lib/router';
import { useSetting } from '../db';
import { FARM } from '../data/farm';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

const TABS: NavItem[] = [
  { path: '', label: 'Today', icon: 'home' },
  { path: 'map', label: 'Map', icon: 'map' },
  { path: 'count', label: 'Quick count', icon: 'plus' },
  { path: 'species', label: 'Species', icon: 'book' },
  { path: 'seasons', label: 'Seasons', icon: 'sun' },
];

const SIDEBAR: (NavItem | 'gap')[] = [
  { path: '', label: 'Today', icon: 'home' },
  { path: 'map', label: 'Map', icon: 'map' },
  { path: 'species', label: 'Species', icon: 'book' },
  { path: 'seasons', label: 'Seasons', icon: 'sun' },
  { path: 'records', label: 'All records', icon: 'list' },
  'gap',
  { path: 'count', label: 'Quick count', icon: 'binoculars' },
  { path: 'sighting', label: 'Sighting', icon: 'pin' },
  { path: 'plant', label: 'Plant record', icon: 'flower' },
  { path: 'listen', label: 'Bird sounds', icon: 'mic' },
  { path: 'rain', label: 'Rain', icon: 'drop' },
  'gap',
  { path: 'settings', label: 'Settings', icon: 'settings' },
];

function isCurrent(path: string, current: string) {
  return path === current;
}

export function TabBar({ current }: { current: string }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) =>
        tab.path === 'count' ? (
          <a key={tab.path} href={href(tab.path)} className="tabbar__count" aria-label={tab.label}>
            <span>
              <Icon name="plus" size={26} strokeWidth={2.2} />
            </span>
          </a>
        ) : (
          <a key={tab.path} href={href(tab.path)} aria-current={isCurrent(tab.path, current) ? 'page' : undefined}>
            <Icon name={tab.icon} size={24} />
            <span>{tab.label}</span>
          </a>
        ),
      )}
    </nav>
  );
}

export function Sidebar({ current }: { current: string }) {
  const recorder = useSetting<string>('recorder', '');
  return (
    <aside className="sidebar">
      <a className="sidebar__brand" href={href('')}>
        <Logo size={44} />
        <span>
          <strong>{FARM.name}</strong>
          <small>Veldboek · {FARM.region}</small>
        </span>
      </a>
      <nav aria-label="Sections">
        {SIDEBAR.map((item, i) =>
          item === 'gap' ? (
            <span key={`gap${i}`} className="sidebar__gap" />
          ) : (
            <a key={item.path} href={href(item.path)} aria-current={isCurrent(item.path, current) ? 'page' : undefined}>
              <Icon name={item.icon} size={20} />
              {item.label}
            </a>
          ),
        )}
      </nav>
      <div className="sidebar__foot">
        {recorder ? <PersonAvatar name={recorder} size={36} active /> : <Icon name="phone" size={20} />}
        <span>
          <strong>Saved on this device</strong>
          <small>{recorder ? `Recording as ${recorder}` : 'Choose who is recording in Settings'}</small>
        </span>
      </div>
    </aside>
  );
}
