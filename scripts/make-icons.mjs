// Renders the hartebeest mark (logo A) to the PNG icons the app manifest and iPhone need.
// Run with `npm run icons` after changing the artwork; the PNGs are committed.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const head = `
  <g fill="none" stroke="#F6EAD7" stroke-width="6.5" stroke-linecap="round">
    <path d="M47 25 C42 22 36 20 36 13 C36 9 37.5 7 34 3.5"/>
    <path d="M53 25 C58 22 64 20 64 13 C64 9 62.5 7 66 3.5"/>
  </g>
  <g fill="#F6EAD7">
    <path d="M45 34 L46 24 L54 24 L55 34 Z"/>
    <path d="M40 38 Q28 30 18 34 Q26 43 41 45 Z"/>
    <path d="M60 38 Q72 30 82 34 Q74 43 59 45 Z"/>
    <path d="M42 31 Q50 27 58 31 L62 41 Q62 49 58 59 L56 84 Q55 93 50 93 Q45 93 44 84 L42 59 Q38 49 38 41 Z"/>
  </g>
  <path d="M48 49 Q50 47.5 52 49 L52.8 68 Q50 76 47.2 68 Z" fill="#7E3517"/>
  <circle cx="47.3" cy="88.3" r="1.4" fill="#7E3517"/>
  <circle cx="52.7" cy="88.3" r="1.4" fill="#7E3517"/>
  <circle cx="43.5" cy="45" r="2.3" fill="#3A1A0A"/>
  <circle cx="56.5" cy="45" r="2.3" fill="#3A1A0A"/>`;

// Rounded tile with transparent corners, for browsers and the favicon.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="#A94A24"/>${head}</svg>`;

// Full bleed square; the head is scaled down to sit inside the given safe area.
const square = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#A94A24"/>
  <g transform="translate(50 50) scale(${scale}) translate(-50 -48)">${head}</g></svg>`;

const out = new URL('../public/', import.meta.url);
await mkdir(new URL('icons/', out), { recursive: true });

const render = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 100) * 4 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(file, out)));

await render(rounded, 192, 'icons/icon-192.png');
await render(rounded, 512, 'icons/icon-512.png');
await render(square(0.72), 512, 'icons/maskable-512.png');
await render(square(0.9), 180, 'apple-touch-icon.png');
console.log('Icons written to public/');
