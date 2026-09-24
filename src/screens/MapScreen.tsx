import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '../components/Icon';
import { iconSvg } from '../components/icons';
import { useRecords, type FieldRecord } from '../db';
import { FARM } from '../data/farm';
import { GROUPS, getSpecies, type Group } from '../data/species';
import { formatDay, formatTime, plural } from '../lib/format';
import { groupStyle, recordGroup, recordTitle, recordValue } from '../lib/records';
import { href } from '../lib/router';
import { toast } from '../lib/toast';

type Period = '30' | 'year' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: '30', label: '30 days' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All' },
];

const MAP_GROUPS: Group[] = ['game', 'birds', 'predators', 'small', 'plants'];

function inPeriod(r: FieldRecord, period: Period, now: number): boolean {
  if (period === 'all') return true;
  if (period === '30') return now - r.at < 30 * 86_400_000;
  return new Date(r.at).getFullYear() === new Date(now).getFullYear();
}

function pinIcon(r: FieldRecord): L.DivIcon {
  const style = groupStyle(recordGroup(r));
  const badge = r.kind === 'animal' && (r.n ?? 1) > 1 ? `<b>${Number(r.n)}</b>` : '';
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin" style="background:${style.colour}">${iconSvg(style.icon, 16, 2.4)}${badge}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

// Built with DOM text nodes so names and notes typed by people can never inject markup.
function popupFor(r: FieldRecord): HTMLElement {
  const box = document.createElement('div');
  box.className = 'popup';
  const species = getSpecies(r.speciesId);
  const title = document.createElement(species ? 'a' : 'strong');
  title.textContent = `${recordTitle(r)} · ${recordValue(r)}`;
  if (species) (title as HTMLAnchorElement).href = href(`species/${species.id}`);
  const meta = document.createElement('span');
  meta.textContent = [formatDay(r.at), formatTime(r.at), r.camp, r.by].filter(Boolean).join(' · ');
  box.append(title, meta);
  if (r.note) {
    const note = document.createElement('span');
    note.textContent = r.note;
    box.append(note);
  }
  return box;
}

export function MapScreen() {
  const records = useRecords();
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.LayerGroup | null>(null);
  const [shown, setShown] = useState<Set<Group>>(() => new Set(MAP_GROUPS));
  const [period, setPeriod] = useState<Period>('year');

  useEffect(() => {
    if (!holder.current) return;
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    });
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: '© OpenStreetMap contributors, SRTM · style © OpenTopoMap (CC BY-SA)',
    });
    const map = L.map(holder.current, { zoomControl: false, layers: [satellite] }).setView(FARM.centre, 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.layers({ Satellite: satellite, 'Contour map': topo }, undefined, { position: 'bottomright' }).addTo(map);
    L.marker(FARM.centre, {
      icon: L.divIcon({ className: 'pin-wrap', html: `<span class="pin pin--home">${iconSvg('home', 16, 2.2)}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
      title: 'House',
      keyboard: false,
    }).addTo(map);
    pinsRef.current = L.layerGroup().addTo(map);
    meRef.current = L.layerGroup().addTo(map);
    map.on('locationfound', (e: L.LocationEvent) => {
      meRef.current?.clearLayers();
      L.circle(e.latlng, { radius: e.accuracy, color: '#1F6FB2', weight: 1, fillOpacity: 0.12 }).addTo(meRef.current!);
      L.circleMarker(e.latlng, { radius: 7, color: '#FFFFFF', weight: 2.5, fillColor: '#1F6FB2', fillOpacity: 1 }).addTo(meRef.current!);
    });
    map.on('locationerror', () => toast('Could not find your position'));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return (records ?? []).filter(
      (r) => r.lat !== undefined && r.lng !== undefined && r.kind !== 'rain' && shown.has(recordGroup(r) as Group) && inPeriod(r, period, now),
    );
  }, [records, shown, period]);

  useEffect(() => {
    const pins = pinsRef.current;
    if (!pins) return;
    pins.clearLayers();
    for (const r of visible) {
      L.marker([r.lat!, r.lng!], { icon: pinIcon(r), title: recordTitle(r) }).bindPopup(popupFor(r)).addTo(pins);
    }
  }, [visible]);

  function toggle(group: Group) {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <div className="mapview">
      <div ref={holder} className="mapview__map" aria-label="Farm map" />
      <div className="mapview__top">
        <div className="mapview__chips" role="group" aria-label="Show on the map">
          {MAP_GROUPS.map((g) => (
            <button key={g} type="button" className="map-chip" aria-pressed={shown.has(g)} onClick={() => toggle(g)}>
              <span style={{ background: GROUPS[g].colour }} />
              {GROUPS[g].label}
            </button>
          ))}
        </div>
        <div className="mapview__period" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mapview__foot">
        <span>{visible.length ? `${plural(visible.length, 'record')} with GPS` : 'No records with GPS for this period'}</span>
      </div>
      <button
        type="button"
        className="mapview__locate"
        aria-label="Show my position"
        onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true })}
      >
        <Icon name="locate" size={22} />
      </button>
    </div>
  );
}
