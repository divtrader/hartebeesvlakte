# BirdNET model files

These are the BirdNET V2.4 bird sound model files in TensorFlow.js format, used unchanged:

- `model.json` and `group1-shard*of13.bin`: the sound classifier (6,522 classes, 3 second clips at 48 kHz).
- `area-model/`: the location and season filter (latitude, longitude, week of 48).
- `labels/en_uk.txt` and `labels/af.txt`: English and Afrikaans names, one line per class.

Copied from https://github.com/birdnet-team/real-time-pwa, commit 6ab67ac09fa64d98858b90f14318229aca9bb7dc, folder `public/models/birdnet/`. The same model is published on Zenodo: https://zenodo.org/records/15050749.

## Credit

BirdNET is developed by the K. Lisa Yang Center for Conservation Bioacoustics at the Cornell Lab of Ornithology and Chemnitz University of Technology (Stefan Kahl, Connor M. Wood, Maximilian Eibl, Holger Klinck and others).

Kahl, S., Wood, C. M., Eibl, M., & Klinck, H. (2021). BirdNET: A deep learning solution for avian diversity monitoring. Ecological Informatics, 61, 101236.

## Licence

The BirdNET models are licensed under the Creative Commons Attribution NonCommercial ShareAlike 4.0 International License: https://creativecommons.org/licenses/by-nc-sa/4.0/. They are used here in a private, non commercial farm app and have not been modified.

The spectrogram layer and WebGL STFT kernel in `src/birdnet/birdnet.worker.ts` are ported from the same repository, MIT licence, Copyright (c) 2025 BirdNET-Team.
