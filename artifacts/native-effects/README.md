# Native skill visual audit

`npm run test:effects` renders all 96 published native skill definitions through the actual CultivationFX drawing adapter. The camera origin is (1200, 800), not (0, 0). Original cast/update/draw modules, packed atlas metadata and native transformation sprite generation are used.

Each skill is sampled across 15 seconds. PNGs show a representative non-fullscreen-flash frame. `audit.json` retains painted pixel counts, drawImage calls, errors, missing assets, image dependencies and a check that visual ghost casts did not mutate target HP/state.

Result: 96/96 painted, zero errors, zero missing image references, zero target mutations. This is a headless Canvas rendering check, not an iPhone browser test. `contact-sheet.png` shows twelve representative native effects.
