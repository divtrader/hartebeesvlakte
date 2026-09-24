// Inline SVG icons on a 24 unit grid, drawn with strokes in the current text colour.
export const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  binoculars: '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4M4 13l2.5-8H10v10M20 13l-2.5-8H14v10"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  flower: '<circle cx="12" cy="5.2" r="2.4"/><circle cx="15.3" cy="8.5" r="2.4"/><circle cx="12" cy="11.8" r="2.4"/><circle cx="8.7" cy="8.5" r="2.4"/><path d="M12 14.2V21M12 18.5c-1.8 0-3.2-.9-3.8-2.3M12 19.5c1.8 0 3.2-.9 3.8-2.3"/>',
  drop: '<path d="M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5z"/>',
  bird: '<path d="M3 12c4 0 6-1 8-4 1.5-2.2 3.5-3 5.5-2.5L20 7l-2.5 1c0 5.5-4 9-9.5 9H6l2.5-3"/>',
  paw: '<path d="M5.2 10a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M8.7 6.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M11.7 6.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M15.2 10a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M12 12c-3 0-5.5 3.5-5.5 5.5 0 1.5 1.2 2.5 2.7 2.2 1-.2 1.8-.7 2.8-.7s1.8.5 2.8.7c1.5.3 2.7-.7 2.7-2.2 0-2-2.5-5.5-5.5-5.5z"/>',
  claw: '<path d="M6 4c1.5 5 1.5 11-1 16M11.5 3c1.5 6 1.5 12-1 18M17 4c1.5 5 1.5 11-1 16"/>',
  tortoise: '<path d="M4 15c0-4 3.6-7 8-7s8 3 8 7z"/><path d="M20 13.2l2.2-.6M7 15l-1 3M17 15l1 3M9 11.5l3 3.5 3-3.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  share: '<path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  wave: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
  play: '<path d="M8 5.5l10.5 6.5L8 18.5z"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** The icon as an SVG string, for places outside React such as map pins. */
export function iconSvg(name: IconName, size = 20, strokeWidth = 2): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
