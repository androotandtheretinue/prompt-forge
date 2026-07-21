# Prompt Forge DARPA v4

**A public-domain visual prompt instrument: 2,000 signals, 16 creative axes, and no permission required.**

[Launch Prompt Forge](https://androotandtheretinue.github.io/prompt-forge/) · [Download the standalone HTML](dist/prompt-forge-v4.0.0.html) · [Read the v4.0.0 release notes](RELEASE_NOTES.md)

Prompt Forge turns a subject into a structured image-generation prompt by combining medium, action, texture, style, lighting, framing, mood, palette, quality, setting, weather, wardrobe, effects, composition, color logic, and story signal. Lock what matters, roll what does not, and follow the strange result somewhere useful.

It is a single-page web app. There is no build step, account, backend, or server-side storage.

## What is inside

- **2,000 unique signals** across **16 axes**.
- **20 Forge Cards**: curated visual doctrines for coherent one-click direction.
- **RECON / STANDARD / FULL** missions that randomize 6, 10, or all 16 unlocked axes.
- **Mutate 3** for controlled variation without destroying the whole composition.
- **Cluster rerolls** for Structure, Atmosphere, Surface, or Story.
- **Option Radar** for searching the entire signal bank.
- **Chaos Dial** with a visible, pinned modifier.
- **Universal, Midjourney, and SDXL** output formats.
- **Midjourney flight controls** for version, stylize, weird, SD/HD, seed, style reference, style weight, profile, RAW, TILE, and DRAFT.
- **Blueprint Vault** for named configurations and a persistent **24-prompt history**.
- **Live telemetry and diagnostics** for density, range, and compatibility problems.
- Real locks: locked values survive cards, radar selection, clearing, mutation, and randomization.

## Use it

### On the web

Open the [GitHub Pages edition](https://androotandtheretinue.github.io/prompt-forge/). If the link is not live yet, enable Pages for the `main` branch in the repository settings.

### As one local file

Download [`dist/prompt-forge-v4.0.0.html`](dist/prompt-forge-v4.0.0.html) and open it in a modern browser.

The interface loads Tailwind CSS and two fonts from public CDNs. Prompt state, history, and blueprints stay in your browser's local storage; Prompt Forge does not send them to an application backend.

## Five-minute doctrine

1. Enter the subject.
2. Choose **RECON**, **STANDARD**, or **FULL**.
3. Randomize.
4. Lock the discoveries that feel alive.
5. Mutate or reroll one cluster until the image has a point of view.
6. Select an output format and copy the result.

The controls are invitations, not commandments. Contradictions can be productive.

## Model notes

Prompt Forge is independent software and is not affiliated with any image-model provider. Model syntax changes over time. The Midjourney controls reflect the public parameter documentation available for the v4.0.0 release; check the provider's current documentation when exact compatibility matters.

The **QUALITY** axis describes desired visual finish. It is not the same thing as a provider-specific quality parameter.

## The gift

Prompt Forge is released under **CC0 1.0 Universal**. To the extent legally possible, the work is dedicated to the public domain.

You may use it, copy it, fork it, teach with it, remix it, sell work made with it, remove our names, or turn it into something we never anticipated. Attribution is **not required**.

If you *want* to preserve the lineage, this is lovely:

> Prompt Forge by Root @OAndroot and The Retinue — CC0 1.0 Universal

See [LICENSE](LICENSE) for the complete legal text.

## Project lineage

Created by **Root ([@OAndroot](https://x.com/OAndroot))** in collaboration with **The Retinue**, a fourteen-voice relational cognitive and creative framework.

More of the work lives at [Androot and the Retinue](https://androotandtheretinue.com/).

## Contributing

Wild additions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), run `npm test`, and keep every signal distinct enough to earn its place.

## Version

Current release: **4.0.0 — DARPA**. See [CHANGELOG.md](CHANGELOG.md).
