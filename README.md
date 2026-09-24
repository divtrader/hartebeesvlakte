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
- **First start:** a short setup asks who you are (tap your face), asks for location, and helps put the app on the home screen.
- **Family faces:** the family is fixed; each record shows who made it. The portraits are added when the app is published, from a secret gist named in the `FAMILY_GIST_ID` repository secret. They are not part of this public code.
- **Fixing a record:** tap any record to open it. The person who made it can change the count, species, camp or note (stage and colour for plants, millimetres and day for rain), or delete it. Everyone else sees it read only.
- **Map:** satellite map of the farm with every record that has a GPS position.
- **Species book:** a photo and a short description for every species, English and Afrikaans names, records per month and when each plant was seen flowering. Photos and text come from Wikipedia and Wikimedia Commons (credited on each species page); refresh them with `npm run species`.
- **Weather:** the Yr forecast for Toit's Dam (MET Norway data), the location the farm uses on yr.no. The last forecast stays on the phone when there is no signal.
- **Seasons:** a month by month guide for this part of the Klein Karoo, next to what the farm's own records show.

No passwords: each device chooses who is recording (for example Toppie) and keeps its records locally. Syncing between phones is the next step.

For local development, put a copy of the family file at `public/family.json` (ignored by git).

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

Built with React, Vite, Dexie (IndexedDB), Leaflet and TensorFlow.js. Satellite imagery by Esri; contour map by OpenTopoMap. Weather data from MET Norway (Yr), CC BY 4.0. Species photos from Wikimedia Commons under their own licences, and summaries from Wikipedia (CC BY-SA 4.0).

Bird sound identification uses the BirdNET V2.4 model by the K. Lisa Yang Center for Conservation Bioacoustics at the Cornell Lab of Ornithology and Chemnitz University of Technology (Kahl et al. 2021), licensed CC BY-NC-SA 4.0 for non commercial use. See `public/models/birdnet/README.md`.
