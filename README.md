# Hartebeesvlakte Veldboek

A field book app for Hartebeesvlakte, a farm of about 4,000 ha in the Klein Karoo. It counts and tracks the game, birds, predators, small animals and plants on the farm, and follows the seasons: what flowers when, which birds arrive, when the animals calve.

**Open the app:** https://divtrader.github.io/hartebeesvlakte/

## Installing it

- **iPhone:** open the link above in Safari, tap Share, then Add to Home Screen.
- **Android:** open the link in Chrome, tap the ⋮ menu, then Install app (or Add to Home screen). Chrome may also offer an Install button in the app.

It then opens full screen like an app and works without signal. Records are saved on the phone.

## What it does

- **Quick count:** a big + for every animal you see, grouped as Game, Birds, Predators and Small life. The count in progress is kept if the phone locks.
- **Sighting:** one animal or group, with photos and a note.
- **Plant record:** stage (buds, flowering, seeding), how many plants, flower colour, and photo points to retake every season. Unknown plants can be named later.
- **Rain:** readings from the rain gauge.
- **Bird sounds:** listens through the microphone and names birds from their calls with BirdNET, filtered to the species expected at the farm in the current week. The 3 second recording is saved with the record so it can be checked later. The 60 MB model downloads once on request, then works without signal.
- **Family faces:** everyone picks their own face to show who made each record. The faces come from a private family file loaded in Settings; they are not part of this public code.
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

Built with React, Vite, Dexie (IndexedDB), Leaflet and TensorFlow.js. Satellite imagery by Esri; contour map by OpenTopoMap.

Bird sound identification uses the BirdNET V2.4 model by the K. Lisa Yang Center for Conservation Bioacoustics at the Cornell Lab of Ornithology and Chemnitz University of Technology (Kahl et al. 2021), licensed CC BY-NC-SA 4.0 for non commercial use. See `public/models/birdnet/README.md`.
