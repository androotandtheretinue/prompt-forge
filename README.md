# Prompt Forge DARPA v5

**A public-domain, user-extensible visual prompt instrument: 2,032 signals, 16 creative axes, drag-strumming, custom pools, a three-state signal rig, and no permission required.**

[Launch Prompt Forge](https://androotandtheretinue.github.io/prompt-forge/) · [Read the v5.2.0 release notes](RELEASE_NOTES.md)

Prompt Forge turns a subject into a structured image-generation prompt by combining medium, action, texture, style, lighting, framing, mood, palette, quality, setting, weather, wardrobe, effects, composition, color logic, and story signal.

Pin what matters. Mute what does not. Roll the rest. Strum the board. Add your own signals. Follow the strange result somewhere useful.

It is a single static HTML file. There is no account, backend, build step, or server-side storage.

## What is inside

- **2,032 signals** across **16 axes**, including a **160-medium** bank that covers still images and images in motion — Claymation, Rotoscoping, Stop Motion, Cel Animation, Machinima, and the pre-cinema motion studies they came from.
- **21 Forge Cards**, including the new **DARPA** card for phosphor-terminal, scan-line, telemetry, and retro-defense-interface aesthetics.
- **Drag Strum**: hold and sweep across category labels to repeatedly randomize unlocked axes.
- **Shift + Drag Step Strum**: advance each crossed category through its pool.
- **Custom Signals**: add persistent entries to any category pool.
- Custom signals participate in randomization, strumming, Option Radar, and Blueprint saves.
- **Clear Unlocked** clears the subject and every unlocked axis while preserving locked values and intentionally locked blanks.
- Centralized browser randomness avoids immediate repeat selections where possible.
- **RECON / STANDARD / FULL** missions randomize 6, 10, or all 16 unlocked axes.
- **Mutate 3** creates controlled variation without destroying the whole composition.
- **Signal Rig**: set every axis to **live**, **pinned**, or **muted** before you forge. Muted axes stay blank through everything.
- **MUTE BLANKS / PIN FILLED / ALL LIVE** configure the whole rig in one move.
- **Cluster rerolls** target Structure, Atmosphere, Surface, or Story. The four scopes partition the sixteen axes, and hovering one outlines exactly the rows it will change.
- **Option Radar** searches built-in and custom signals.
- **Chaos Dial** provides a visible, pinned modifier.
- **Universal, Midjourney, and SDXL** output formats.
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

Sixteen chips above the board decide which axes are in play. Tap one to cycle it.

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

## The DARPA card

The DARPA Forge Card treats the aesthetic as a rendering doctrine rather than forcing an operator or control-room scene.

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

Current release: **5.2.0 — Signal Rig and Images in Motion**. See [CHANGELOG.md](CHANGELOG.md).
