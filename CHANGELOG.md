Changelog
All notable changes to Prompt Forge are documented here.
[5.1.0] — 2026-07-24
Added
Added repeated drag-strumming across the sixteen category rows.
Added Shift-drag step strumming for sequential movement through category pools.
Added persistent custom signals for every category.
Added custom-signal participation in randomization, strumming, Option Radar, and Blueprint saves.
Added Clear Unlocked while preserving locked values and intentionally locked blanks.
Added the DARPA Forge Card and its phosphor-terminal, CRT-raster, telemetry, wireframe, and defense-interface vocabulary.
Changed
Centralized random selection behind a browser-crypto-backed random helper.
Random rerolls now avoid selecting the current value when alternatives exist.
Strumming can retrigger repeatedly during one held pointer gesture, including when returning to a previously crossed row.
The DARPA card now leaves scene-dependent axes blank so subjects remain the image rather than appearing on an operator's monitor.
Prompt Forge is now a user-extensible instrument rather than a fixed signal bank.
Moved the v5 behavior layer into `v5.js` while retaining the original static application foundation.
Persistence
Custom category pools are stored in browser local storage.
Newly saved Blueprints preserve custom pools alongside selections, locks, negatives, output format, and flight controls.
[5.0.0] — 2026-07-24
Added
Introduced the Strum interaction model.
Added per-category custom pool management.
Added the first DARPA aesthetic card.
Added Clear Unlocked.
Upgraded the application identity from DARPA v4 to DARPA v5.
[4.0.0] — 2026-07-20
Added
Expanded the forge from 1,343 to exactly 2,000 unique signals.
Added Composition, Color Logic, and Story Signal axes for a total of 16.
Added 12 curated Forge Cards, bringing the collection to 20.
Added RECON, STANDARD, and FULL mission doctrines.
Added Mutate 3 and Structure, Atmosphere, Surface, and Story cluster rerolls.
Added cross-category Option Radar search.
Added Midjourney version, stylize, weird, resolution, seed, style-reference, style-weight, profile, RAW, TILE, and DRAFT controls.
Added live prompt telemetry and compatibility diagnostics.
Added persistent 24-prompt history and named Blueprint Vault configurations.
Changed
Locks now prevent every mutation route, including preset, radar, clear, and direct randomization operations.
Prompt axes now emit in a deliberate narrative-to-finish order.
Forge Cards clear stale unlocked values before applying their own doctrine.
Expanded aspect-ratio controls with 2:3 and 4:3.
Increased the visual hierarchy and information density of preset cards and category rows.
Validated
2,000 signals with no duplicates.
Every Forge Card value resolves to a real option.
All category clusters and prompt-order references resolve.
RECON selects 6 axes, STANDARD selects 10, and FULL selects 16.
Model-incompatible parameters are suppressed or diagnosed.
Runtime, persistence, locking, blueprint, and prompt-building suites pass with zero faults.
[3.0.0]
Original public Prompt Forge foundation.
Thirteen visual categories, 1,343 options, eight presets, chaos controls, negative prompts, and multi-model output formatting.
