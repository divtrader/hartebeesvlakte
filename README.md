# Hartebeesvlakte Veldboek

A field book app for Hartebeesvlakte, a farm of about 4,000 ha in the Klein Karoo. It counts and tracks the game, birds, predators, small animals and plants on the farm, and follows the seasons: what flowers when, which birds arrive, when the animals calve.

**Open the app:** https://divtrader.github.io/hartebeesvlakte/

## Using it on an iPhone

1. Open the link above in Safari.
2. Tap Share, then Add to Home Screen.

It then opens full screen like an app and works without signal. Records are saved on the phone.

## What it does

- **Quick count:** a big + for every animal you see, grouped as Game, Birds, Predators and Small life. The count in progress is kept if the phone locks.
- **Sighting:** one animal or group, with photos and a note.
- **Plant record:** stage (buds, flowering, seeding), how many plants, flower colour, and photo points to retake every season. Unknown plants can be named later.
- **Rain:** readings from the rain gauge.
- **Map:** satellite map of the farm with every record that has a GPS position.
- **Species book:** English and Afrikaans names for every species, with records per month and when each plant was seen flowering.
- **Seasons:** a month by month guide for this part of the Klein Karoo, next to what the farm's own records show.
- **Backup and spreadsheet:** download a backup (records and photos) or a CSV file for Excel.

No passwords: each device chooses who is recording (for example Toppie) and keeps its records locally. Syncing between phones is the next step.

## Developing

```bash
npm install
npm run dev
```

Then open http://localhost:5173/hartebeesvlakte/.

- `npm test` runs the unit tests.
- `npm run build` checks the types and builds the site into `dist/`.
- `npm run icons` redraws the app icons from the hartebeest logo.

Every push to `main` is tested, built and published to GitHub Pages by `.github/workflows/deploy.yml`.

Built with React, Vite, Dexie (IndexedDB) and Leaflet. Satellite imagery by Esri; contour map by OpenTopoMap.
