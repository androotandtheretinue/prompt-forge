Changelog
All notable changes to Prompt Forge are documented here.
[Unreleased]
Added
Added `llms.txt`, a plain-text front door for machine readers: what Prompt Forge is, the sixteen axes, where the vocabulary lives, and the operating instruction.
Added `vocabulary.json` and `vocabulary.txt`, the complete 2,032-signal vocabulary published as data so nothing has to scrape the application. Both are generated from `index.html` by `npm run vocabulary`.
Added a `<link rel="alternate">` and an `ai-vocabulary` meta tag to the first few hundred bytes of the `<head>`, so a truncated fetch still lands on a pointer to the vocabulary. `index.html` is ~175 kB and the signal pools begin around 40 kB in, past where many fetchers stop.
Added `.nojekyll` so GitHub Pages serves the repository verbatim rather than running it through a static-site build.
Added audit checks that the published vocabulary files match the live `categories` object, that `llms.txt` references both, and that the `<head>` pointer is present.
Fixed
Corrected `<head>` metadata that was two versions stale: the page title and Open Graph title still said DARPA v4, and the description still claimed 2,000 signals. This is the region a truncating fetcher is most likely to read, so it was the worst place in the file to be wrong.
Narrowed the self-containment check to `rel="stylesheet"`. It previously rejected any local `<link href>`, which would have failed the new `rel="alternate"` vocabulary pointer — a data reference the page does not need in order to render.
[5.2.0] — 2026-07-24
Added
Added 32 mediums, taking the axis from 128 to 160 and the forge from 2,000 to 2,032 signals.
Added an image-in-motion bank of 20: Claymation, Stop Motion, Puppet Animation, Cutout Animation, Silhouette Animation, Pixilation, Sand Animation, Paint-on-Glass Animation, Pinscreen Animation, Cel Animation, Rotoscoping, Rubber Hose Animation, Machinima, Motion Capture Animation, Zoetrope Strip, Flip Book Sequence, Chronophotography, Slit-Scan Photography, Stroboscopic Exposure, and Time-Lapse Composite. The forge could previously name 128 ways to make a still image and no way to make an image that moves.
Added 12 historical processes the v4 expansion reached past: Mezzotint, Aquatint, Drypoint, Silverpoint, Autochrome, Albumen Print, Gum Bichromate Print, Platinum Palladium Print, Camera Obscura Study, Reverse Glass Painting, Sgraffito Plaster, and Pietra Dura Inlay.
Added the Signal Rig: a sixteen-chip strip that sets which axes are in play before forging.
Added three named signal states — live, pinned, and muted — read from the lock and value the forge already stored.
Added a per-row mute control that blanks an axis and holds it blank in a single tap, replacing the undiscoverable clear-then-lock sequence.
Added MUTE BLANKS, PIN FILLED, and ALL LIVE for setting the whole rig at once.
Added a live rig readout counting live, pinned, and muted axes.
Added cluster hover preview: hovering a reroll scope outlines the exact rows and chips it will change before the click commits.
Added generated cluster button titles listing member axes, so a scope's label can no longer drift from its membership.
Changed
Reroll scopes now partition the sixteen axes instead of overlapping. Structure and Story previously shared three of their four rows, which is why the four buttons felt interchangeable.
Structure is now Composition, Camera, and Setting; Story is now Story Signal, Action, and Wardrobe; Surface absorbs Color Logic, which belonged to no scope at all and was unreachable from any cluster button.
Cluster buttons are prefixed with ⟳ so the label reads as the action it performs.
The lock glyph now distinguishes pinned (🔐) from muted (🚫); a muted row is styled slate rather than gold.
Locking a row that holds no value now presents as muting it. The underlying state is unchanged.
`toggleLock` and `unlockAll` route through one state setter instead of poking DOM nodes directly, and no longer throw when a row is absent.
Fixed
Fixed the audit harness, which had silently verified nothing since v5 shipped. Its script-extraction pattern anchored on `</script></body>` and began matching at the first inline block, so adding the `v5.js` tag made it swallow markup as JavaScript and fail to parse the application at all.
Folded `v5.js` back into `index.html` as a second inline script block. The project described itself as single-file for two releases while shipping two files; it is now one file again, and the audit fails if a local script or stylesheet reference is reintroduced.
Removed `dist/` and the build step. With `index.html` self-contained there is nothing left to mirror, which retires the drift that produced the stale distribution in the first place.
Validated
2,032 unique signals across 16 axes, with no duplicates within any axis and every axis a multiple of 16.
Reroll scopes are disjoint and cover all sixteen axes.
The three rig states derive correctly from lock and value for every axis.
Every inline script block parses, and `index.html` references no local script file.
The merged file opens and runs correctly straight from disk over `file://` with no server. Tailwind and the two webfonts are still fetched from public CDNs, so an offline copy runs fully but renders with fallback styling.
Muted axes survive randomize, Forge Cards, cluster rerolls, strumming, Mutate 3, and Option Radar, and persist across reload and Blueprint round-trips.
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
