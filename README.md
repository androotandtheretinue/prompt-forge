# Prompt Forge

*Distributed Axis Randomization & Prompt Assembly*

**A public-domain, user-extensible visual prompt instrument: 2,304 signals, 17 creative axes, drag-strumming, custom pools, a three-state signal rig, and no permission required.**

[Launch Prompt Forge](https://androotandtheretinue.github.io/prompt-forge/) · [Read the v5.4.0 release notes](RELEASE_NOTES.md)

Prompt Forge turns a subject into a structured image-generation prompt by combining medium, action, figure, texture, style, lighting, framing, mood, palette, quality, setting, weather, wardrobe, effects, composition, color logic, and story signal.

Pin what matters. Mute what does not. Roll the rest. Strum the board. Add your own signals. Follow the strange result somewhere useful.

It is a single static HTML file. There is no account, backend, build step, or server-side storage.

## What is inside

- **2,304 signals** across **17 axes**, including a **160-medium** bank that covers still images and images in motion — Claymation, Rotoscoping, Stop Motion, Cel Animation, Machinima, and the pre-cinema motion studies they came from.
- **Figure**: 80 signals for how the body is arranged, as distinct from what it is doing. Contrapposto, counter-rotated shoulders and hips, weight on one hip, chin down with the eyes up. Action tells you the subject is reclining; Figure tells you how.
- **Color Logic**: 80 *relational* instructions rather than colors — chromatic skin against achromatic clothing, warm subject in a cool world, pearlescence only in the highlights. It describes a relationship between regions of the image, which is how a colorist thinks and is the axis with no equivalent in other prompt tools.
- **29 Forge Cards**, including eight warm-figure doctrines — Komorebi, Waterline, Salt and Gold, Poolside Noon, Lido 1972 and others — and the **PHOSPHOR** card for phosphor-terminal, scan-line, telemetry, and retro-interface aesthetics.
- **Shift + any reroll** surveys instead of shuffling — the roll-all button, a single axis's 🎲, a cluster scope, or the strum lane. Hold Shift and every value you roll past is set aside, so each roll shows you something you have not seen and the pool narrows as you refuse it. Release and everything comes back. A plain reroll only declines to repeat the value already on screen, which on a 176-option axis means you never meet most of it.
- **Shift + strum** surveys as you drag, so a sweep down the board shows you signals you have not seen instead of the same handful. Banking is deliberately unavailable to a strum: one drag refuses hundreds of signals, and a permanent decision should not be reachable by a gesture built to be careless. Holding the banking modifier while dragging surveys instead.
- **Ctrl+Shift + any reroll click** banks instead of surveying. A banked signal is filtered out of every draw whether or not a key is held, and stays out until you let it back in — the difference between "not this pass" and "not again". The **⚱ BANISHED SIGNALS** panel lists everything banked by axis, each entry its own undo, with one button to release the lot. The bank persists across sessions and refuses to take any axis below two signals, since nothing rescues a permanent ban.
- **Mobile layout** puts the board first: the panels that tune the instrument sit below the rows rather than above them, and the rows pack into two lines. Nothing is removed — locks stay inline on every row, and the heavy panels are a tap away.
- **Strum lane**: a rail down the left of the board. Drag along it to reroll whichever row you are level with — height means axis, so a slow drag walks the axes in order and the same drag played twice does the same thing. Arrow keys and space reach it too.
- **Drag Strum**: hold and sweep across category labels to repeatedly randomize unlocked axes.
- **Ctrl + Drag Step Strum**: advance each crossed category through its pool one at a time. Step moved to Ctrl so that Shift means the same thing everywhere.
- **Custom Signals**: add persistent entries to any category pool.
- Custom signals participate in randomization, strumming, Option Radar, and Blueprint saves.
- **Clear Unlocked** clears the subject and every unlocked axis while preserving locked values and intentionally locked blanks.
- Centralized browser randomness avoids immediate repeat selections where possible.
- **RECON / STANDARD / FULL** missions randomize 6, 10, or all 17 unlocked axes.
- **Mutate 3** creates controlled variation without destroying the whole composition.
- **Signal Rig**: set every axis to **live**, **pinned**, or **muted** before you forge. Muted axes stay blank through everything.
- **MUTE BLANKS / PIN FILLED / ALL LIVE** configure the whole rig in one move.
- **Cluster scopes** target Structure, Atmosphere, Surface, or Story. The four scopes partition the seventeen axes, and hovering one outlines exactly the rows it will change.
- Each scope carries **⟳ reroll, 🔐 pin, and 🚫 mute** — the same three verbs a single row has. Mute Story to build an image that carries no narrative, action, figure or wardrobe at all. Both operators toggle back to live.
- **Option Radar** searches built-in and custom signals.
- **Chaos Dial** corrupts the signal text itself, on a meter that documents its own thresholds: **DRIFT** at 25 (semantic variants), **MISSPELL** at 50, **LEET** at 75, **ZALGO** at the last tick. Zones are cumulative, so high chaos gives a mix rather than a uniform filter. Locked signals are immune, the corruption is seeded and saved with Blueprints, and every damaged signal is shown beside its original.
- **Universal, Midjourney, SDXL and BOORU** output formats.
- **BOORU mode** translates the board into Danbooru tags for Illustrious, NoobAI, WAI and Pony checkpoints. Camera, pose, garment, place and light have real tag equivalents and are mapped; everything else passes through as prose, and the panel names which axes did which. The quality axis stands aside — booru checkpoints use their own quality vocabulary — and the prefix, subject tags and negative are editable, since every checkpoint family wants a different incantation.
- **Midjourney flight controls** for version, stylize, weird, SD/HD, seed, style reference, style weight, profile, RAW, TILE, and DRAFT.
- **Blueprint Vault** stores named configurations, including custom pools.
- Persistent **24-prompt history**.
- **Live telemetry and diagnostics** for density, range, and compatibility problems.
- Real locks: pinned values and muted blanks survive cards, radar selection, clearing, mutation, strumming, and randomization.

## Use it

### On the web

Open the [GitHub Pages edition](https://androotandtheretinue.github.io/prompt-forge/).

The interface loads Tailwind CSS and two fonts from public CDNs. Prompt state, history, blueprints, and custom signals stay in your browser's local storage; Prompt Forge does not send them to an application backend.

### Local use

Download `index.html` and open it in a modern browser. That one file is the entire program — no build step, no companion scripts, nothing to keep beside it.

Tailwind and two fonts still load from public CDNs, so an offline copy renders with fallback styling. Everything else works with no network at all.

### For AI agents

Point an agent at the Pages URL and tell it to read [`llms.txt`](llms.txt) first. Nothing else is required — that one file is self-sufficient, and it is also embedded verbatim near the top of `index.html`, so an agent that fetches the page instead has the protocol anyway.

It separates two things the project had been conflating:

- **The Protocol** — the seventeen axes with a one-line gloss each, the selection and omission rules, prompt assembly, and what to do about images. This is the portable, machine-readable architecture, and it lives entirely inside `llms.txt` so a truncated fetch or a blocked host cannot cost an agent the ability to use the board.
- **The Lexicon** — the 2,304 curated signals below. Built so a human browsing the board meets language they would not have thought of. An LLM already carries broad visual vocabulary, so this is **optional** for one: useful when you want the curation instead of the model's own priors.

An agent that can read only `llms.txt` fills each axis from its own knowledge and says so. Three modes are valid — `canonical` (every value from the Lexicon), `protocol` (own knowledge), and `mixed` — and naming the mode is required, because a model-supplied value is a good prompt and a false citation, and the label is what keeps those apart.

The prompt is always the deliverable. Generating an image is additional, never a substitute, and an agent with no rendering route still returns a complete result.

The full vocabulary is published as data, so nothing has to scrape the application:

| File | Contents |
| --- | --- |
| [`llms.txt`](llms.txt) | What this is and how to operate it. Start here. |
| [`vocabulary.json`](vocabulary.json) | All 2,304 signals with axis metadata. |
| [`vocabulary.txt`](vocabulary.txt) | The same signals, flat, no parser required. |

Some agents run fetchers that allowlist hosts, and `*.github.io` is not always on the list. That is a host-level policy, not a restriction here — nothing in this project is gated. The same three files are served as plain text from `raw.githubusercontent.com`, and every entry point carries the mirror address so a blocked reader finds the alternative rather than a dead end:

```
https://raw.githubusercontent.com/androotandtheretinue/prompt-forge/main/llms.txt
https://raw.githubusercontent.com/androotandtheretinue/prompt-forge/main/vocabulary.json
https://raw.githubusercontent.com/androotandtheretinue/prompt-forge/main/vocabulary.txt
```

Both paths track `main` and move as the vocabulary grows. Replace `main` with a commit SHA to pin the exact vocabulary a result was built from — `main` for operating the instrument, a pinned SHA for anything you intend to cite.

This exists because `index.html` is ~274 kB and the signal pools begin about 73 kB in — past the point where many fetchers truncate, and past where some strip `<script>` contents entirely. An agent that reads a truncated page tends to supply remembered signals instead of listed ones, which fails while looking like success. The protocol itself sits about 3 kB into the `<head>`, ahead of that wall, so a truncated read still lands on the instructions.

Both vocabulary files are generated from the application by `npm run vocabulary`, and the audit fails if they drift from it.

## Five-minute doctrine

1. Enter the subject.
2. Choose **RECON**, **STANDARD**, or **FULL**.
3. Randomize—or strum across the board.
4. Pin discoveries that feel alive. Mute the axes this image has no use for.
5. Add custom signals when the existing vocabulary cannot hold the idea.
6. Mutate, reroll, or Shift-strum until the image has a point of view.
7. Select an output format and copy the result.

The controls are invitations, not commandments. Contradictions can be productive.

## Strum controls

- **Drag across category labels:** repeatedly randomize unlocked rows as the pointer moves.
- **Move back across a row:** reroll it again without releasing the pointer.
- **Shift + drag:** advance through each crossed category pool instead of randomizing.
- Pinned and muted rows are ignored.

## Signal Rig

Seventeen chips above the board decide which axes are in play. Tap one to cycle it.

| State | Meaning | Behavior |
| --- | --- | --- |
| **live** | in play | rerolls, cards, strums, and randomize may move it |
| **pinned** | frozen at a value | survives every automated operation |
| **muted** | frozen blank | contributes nothing, and stays that way |

- **🚫 MUTE BLANKS** mutes every axis that is currently empty — the fast way to lock in your blanks before you start.
- **🔐 PIN FILLED** pins every axis that currently holds a value.
- **🔓 ALL LIVE** releases everything. Values are kept.

Each row carries its own **🚫** for muting a single axis without touching the rig.

The three states are not new stored data. They are a reading of the lock and the value the forge already kept:

```
live   = !locked
pinned =  locked && value !== ''
muted  =  locked && value === ''
```

So a rig saves to the Blueprint Vault with everything else, and persists across reloads on its own.

The rig is the deliberate counterpart to the mission doctrines: RECON gives you a random six, the rig lets you choose the six.

## Custom pools

Every category row includes a green **＋** control.

Custom signals:

- are stored locally in the browser
- appear in the category dropdown
- join randomization and strumming
- appear in Option Radar
- travel with newly saved Blueprints
- remain separate from the canonical built-in signal banks
- can be deleted from their category's custom-signal panel

### Bringing a vocabulary in

The custom-signal panel takes lists as well as single entries.

- **Import a list into this axis** accepts values separated by newlines or commas, or both. It reports what it added and what it refused as already present.
- **Export or import every custom pool** moves the whole board at once as JSON keyed by axis, so a vocabulary is a portable object rather than browser state. Useful when a set is tuned to one checkpoint and you want another.
- Import merges by default. Ticking **replace** empties every custom pool first, not only the axes named in the file, so the board ends up matching the file rather than running a mixture of two sets.
- Duplicates are judged without regard to case and against the whole pool, built-ins included. A pool holding both `Golden Hour` and `golden hour` would look the same in every list the interface draws, and you could never tell which one a roll produced.
- A malformed file changes nothing and says why. Axes the board does not have are named rather than silently dropped.

Nothing here is curated or shipped. Prompt Forge holds a vocabulary of 2,304 signals chosen for the board; what you import is yours, stays in your browser, and is your responsibility.

## Subject, per output format

The subject is shared across all four output formats, and each format may optionally override it.

A format with no override uses the shared subject. That is the normal case for UNIVERSAL, MIDJOURNEY and SDXL — they want the same sentence, and flipping between them to compare dialects is a reason to use the tool at all.

BOORU is the exception. Danbooru-trained checkpoints want a count declaration — `1girl, solo`, `2girls`, `1boy`, `no humans` — which is not the prose subject translated but different content. Put it in the BOORU override and the other three formats keep the sentence you typed.

- The strip under the subject field names the format it is editing, and lights up only while that format is actually overriding.
- Each format keeps its own pool of saved subjects, shown as chips. Clicking one sets the override.
- The pools take bulk imports on the same terms as the axis pools.
- Overrides travel with Blueprints. Blueprints saved before 5.5 have their old BOORU subject tag read into the booru override rather than dropped.

## The PHOSPHOR card

The PHOSPHOR Forge Card treats the aesthetic as a rendering doctrine rather than forcing an operator or control-room scene.

It emphasizes phosphor monochrome, CRT raster and scan lines, telemetry overlays, command-display composition, archival display fidelity, and cold-war interface paranoia while leaving scene-dependent axes such as setting and wardrobe blank.

## Model notes

Prompt Forge is independent software and is not affiliated with any image-model provider. Model syntax changes over time. Check the provider's current documentation when exact compatibility matters.

The **QUALITY** axis describes desired visual finish. It is not the same thing as a provider-specific quality parameter.

## The gift

Prompt Forge is released under **CC0 1.0 Universal**. To the extent legally possible, the work is dedicated to the public domain.

You may use it, copy it, fork it, teach with it, remix it, sell work made with it, remove our names, or turn it into something we never anticipated. Attribution is **not required**.

If you choose to preserve the lineage, this is lovely:

> Prompt Forge by Root @OAndroot and The Retinue — CC0 1.0 Universal

See [LICENSE](LICENSE) for the complete legal text.

## Project lineage

Created by **Root ([@OAndroot](https://x.com/OAndroot))** in collaboration with **The Retinue**, a fourteen-voice relational cognitive and creative framework.

More of the work lives at [Androot and the Retinue](https://androotandtheretinue.com/).

## Contributing

Wild additions are welcome. Please read [CONTRIBUTING.md], run `npm test`, and keep every built-in signal distinct enough to earn its place.

## Version

Current release: **5.4.0 — Field Reports**. See [CHANGELOG.md](CHANGELOG.md).
