Changelog
All notable changes to Prompt Forge are documented here.
[Unreleased]
Added
Added pin and mute operators to each cluster scope. A scope previously only rerolled; it now carries the same three verbs a single row does, so what you can do to one axis you can do to four at once. Muting Story holds narrative, action, figure and wardrobe blank through every operation, which is how you build an image that carries no story at all.
Both operators are toggles — clicking the engaged one returns the scope to live, so no scope can be stranded held.
Locking a scope that contains a blank row holds that row blank rather than refusing, matching the existing rule that locking an empty row presents as muting it.
Cluster operator titles are generated from live membership and current state, so a label cannot drift from what the button does.
Split `llms.txt` into a PROTOCOL and a LEXICON, protocol first. The axes, selection rules, output contract and image-handling are the portable machine-readable architecture and now live entirely in that one file; the curated vocabulary is named as an optional human-discovery layer. An LLM already carries broad visual vocabulary — what it lacked was the structure.
Each axis now carries a one-line gloss, so an agent can fill `colorlogic` or `figure` from its own knowledge. The key alone was not enough to act on.
Replaced "if you cannot reach the vocabulary, say so and stop" with a fallback: fill from your own knowledge and report the mode. Three modes are valid — canonical, protocol, mixed — and naming the mode is required, since a model-supplied value is a good prompt and a false citation.
Stated that the prompt is always the deliverable and that image generation is additional, never a substitute: generate if you can, otherwise delegate, otherwise (on X) ask Grok, otherwise return the prompt alone.
Asked for the axis count to be checked rather than merely stated. An agent produced a correct-looking Blank list with one axis missing from it — sixteen accounted for out of seventeen, palette simply gone. `llms.txt` now says to count before sending, and names palette and colorlogic as the two most often lost.
Singled out the assembled prompt as the part that must never be absent. The same reply returned the idea, subject, axes and mode, and no prompt — four parts of five, missing the only one that is the deliverable rather than a description of it.
Made the output contract survive follow-up turns. An agent that had just produced a fully compliant reply was asked for "one more" and returned prose and an image with no axes at all — it did not refuse the protocol, it stopped treating the exchange as one. A follow-up reads as conversation, and conversation is where a fetched instruction goes quiet. `llms.txt` now states in its opening lines that every reply returns all five parts including follow-ups, and repeats in the output section that a second request is a second prompt.
Moved a one-paragraph summary of the output contract to the top of the file, above the axis list, so an agent that skims meets the contract before the detail.
Required that every axis be considered and every blank reported. An agent filled five axes and said nothing about the other twelve, and in the output a deliberate omission and a pass that simply stopped early are indistinguishable. Selection now says to go through all seventeen and decide each one; the output contract requires naming every blank axis so filled and blank come to seventeen, with reasons welcome and never required. Listing the blanks is the only evidence restraint happened rather than inattention.
Established in `llms.txt` that the subject is separate from the axes and comes first. The app has kept the subject in its own field since v4 and puts it at the head of the prompt, but the machine-facing document described only the axes — so an agent with a character to place had nowhere to put it. One wrote the character into `figure`, which is for how a body is arranged rather than whose body it is. The output contract now has five parts rather than four, and the `figure` gloss says explicitly that it is not the subject.
Made compliance falsifiable. An agent asked to use the board returned an idea and an image with no axis lines, then answered a challenge by asserting it had selected from the categories — a claim nobody could check. `llms.txt` now states that a reply without the axis lines is not a Prompt Forge result whatever was chosen internally, and that a challenge is answered by reprinting the axes rather than by describing the process.
Added a worked example of a compliant reply — ten axes shown, seven named as omitted, with the mode labelled. Agents pattern-match on a concrete shape far more reliably than they follow prose rules, and it demonstrates restraint and mode-labelling in the same twenty lines.
Added audit checks that `llms.txt` keeps its PROTOCOL and LEXICON sections, describes every axis the app defines, still says the prompt is always returned, and carries both the worked example and the not-a-result rule.

[5.3.0] — 2026-07-26
Added
Added eight Forge Cards in a warm-figure register the first twenty had no room for: Komorebi, Negative Fill, Waterline, Salt and Gold, Poolside Noon, Rim Light Confession, Light Through Water, and Lido 1972. Every one specifies a Figure pose and a Color Logic relationship, the two axes that most distinguish this board, and several deliberately leave axes open.
Added FIGURE, a seventeenth axis of 80 signals describing how the body is arranged rather than what it is doing: contrapposto, counter-rotated shoulders and hips, weight on one hip, chin down with the eyes up, hand at the nape. Action carried 160 verbs and not one of them described posture, so the entire language of figure drawing and portrait direction was unreachable from the board.
Added 16 swimwear and poolside garments to Wardrobe, taking it from 144 to 160. The axis could dress a figure for a cleanroom, a beehive, and an antique diving bell, but held exactly one swim-adjacent entry.
Added Figure to the Story reroll scope, which now moves narrative, action, figure, and wardrobe together — what the subject is doing, how the body holds it, and what it wears.
Added `llms.txt`, a plain-text front door for machine readers: what Prompt Forge is, the seventeen axes, where the vocabulary lives, and the operating instruction. Figure and Color Logic are called out by name, since both are unusual and an agent that skips them leaves most of the instrument unused.
Added `vocabulary.json` and `vocabulary.txt`, the complete 2,128-signal vocabulary published as data so nothing has to scrape the application. Both are generated from `index.html` by `npm run vocabulary`.
Added a `<link rel="alternate">` and an `ai-vocabulary` meta tag to the first few hundred bytes of the `<head>`, so a truncated fetch still lands on a pointer to the vocabulary. `index.html` is ~175 kB and the signal pools begin about 34 kB in, past where many fetchers stop.
Added `social-card.png` and the Open Graph and Twitter card metadata that points at it, so shared links render a picture of the board instead of bare text. Regenerated with headless Chrome; the audit checks the file exists, that `og:image` is absolute, and that `twitter:card` is set.
Added raw.githubusercontent.com mirrors for `llms.txt`, `vocabulary.json` and `vocabulary.txt`, plus an ACCESS section stating that nothing here is gated. Some agents run fetchers that allowlist hosts and cannot reach `*.github.io`, which blocks the instructions along with the data. Every entry point now carries the mirror address, and the audit enforces it.
Added `.nojekyll` so GitHub Pages serves the repository verbatim rather than running it through a static-site build.
The `FULL` payload button now derives its axis count instead of restating it, the same fix applied to the footer.
Added audit checks that the published vocabulary files match the live `categories` object, that `llms.txt` references both, and that the `<head>` pointer is present.
Fixed
Fixed the footer, which reported the wrong version twice. The static markup said DARPA v4.0 and the v5 layer overwrote it with a hardcoded v5.1, while `PF_VERSION` sat at 5.2 in the same file. The runtime footer now interpolates `PF_VERSION`.
Tightened `llms.txt` to require that a signal be listed *under the axis it is used in*. The previous wording asked only that values appear in the vocabulary, which permitted relocating a real signal into the wrong axis — observed in the wild, where an agent placed the lighting signal Twilight into weather and produced two lighting selections.
Strengthened the omission guidance after an agent filled all sixteen axes: filling every axis is now named as the signature of completing a form rather than making an image.
Added audit checks that every version string in `index.html` agrees with `package.json`, and that the runtime footer derives its version instead of restating it.
Corrected `<head>` metadata that was two versions stale: the page title and Open Graph title still said DARPA v4, and the description still claimed 2,000 signals. This is the region a truncating fetcher is most likely to read, so it was the worst place in the file to be wrong.
Narrowed the self-containment check to `rel="stylesheet"`. It previously rejected any local `<link href>`, which would have failed the new `rel="alternate"` vocabulary pointer — a data reference the page does not need in order to render.
Changed
Applied restraint to the twelve Forge Cards that set every axis available to them, removing 42 assignments. The cuts were tautologies (Projection Cathedral stated its idea in medium, lighting and wardrobe), weather on interiors (all twelve set it, including a courtroom, a data centre, a sealed bunker and a kitchen), and one outright contradiction (Field Artifact declared Object-Centered Stillness while specifying what a person was doing and wearing). The twelve now set 12–13 axes and leave 4–5 open, so a card hands you a coherent core and empty rows to roll.
Forge Card definitions are written in prompt order, so a card reads in the sequence it builds.
Validated
2,128 unique signals across 17 axes, no duplicates within any axis, every axis a multiple of 16.
28 Forge Cards in source, every value resolving to its correct axis, all metadata present.
Reroll scopes are disjoint and cover all seventeen axes.
Pinned and muted rows survive card application, randomize, cluster rerolls, and strumming.
The published vocabulary files match the application, and every entry point carries the mirror addresses.
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
