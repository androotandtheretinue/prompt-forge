# Prompt Forge 5.3.0 — The Figure

Sixteen axes could say the subject was reclining. None could say how.

5.2 made the board configurable. 5.3 adds the axis that was missing from it, opens the vocabulary to readers who are not human, and takes things *out* of the Forge Cards.

## FIGURE — the seventeenth axis

The action axis carries 160 options and every one is an activity: running, forging, praying, refusing a crown. Not one describes how a body is arranged. No contrapposto. No counter-rotated shoulders and hips. No weight on one hip, no arched back, no chin down with the eyes up, no hand at the nape.

A prompt could say the subject was reclining. It could not say whether the reclining was collapsed, coiled, or held — so the entire language of figure drawing and portrait direction was unreachable from the board.

Eighty signals, grouped the way a photographer or a life-drawing tutor actually speaks:

| Group | Examples |
| --- | --- |
| **Weight and stance** | Contrapposto, Weight on One Hip, Mid-Stride Suspension, Braced Against Wind |
| **Spine and torso** | Arched Back, Coiled Forward Hinge, Collapsed Posture, Reclined Long Line |
| **Shoulders against hips** | Counter-Rotated Shoulders and Hips, Spiral From Hip to Shoulder |
| **Head and neck** | Chin Down Eyes Up, Look Back Over the Shoulder, Neck Extended Away From Shoulders |
| **Arms and hands** | Hand at the Nape, Arms Akimbo, Fingers at the Collarbone |
| **Legs and feet** | Knee Popped, Ankles Crossed Seated, Heel Lifted |
| **Seated and reclining** | Propped on One Elbow, Crouched on the Balls of the Feet, Perched on an Edge |
| **Held tension** | Held Tension Throughout, Fully Released Weight, Stillness Between Two Movements |

Figure joins the **Story** scope, beside action and wardrobe. Rerolling Story now moves all four: what the subject is doing, how the body holds it, and what it wears.

This is not a patch for one use case. The same eighty signals serve a portrait, a character render, a fashion plate, or a crowd.

## Swimwear, and a hole in the wardrobe

The wardrobe axis carried 144 garments — plague doctor robes, a beekeeper suit, a cleanroom bunny suit, an antique deep-sea diving dress — and exactly one swim-adjacent entry, reaching the subject sideways through fashion styling.

Sixteen entries close it, spanning competitive, technical, retro and poolside. Wardrobe reaches 160.

## Eight warm-figure Forge Cards

The first twenty doctrines are cold in a consistent way: cathedrals, black sites, orbital folklore. Not one is about a body being pleasant to look at. The vocabulary supported that register completely — *Komorebi Feeling* has been sitting in the mood axis since v4 — but no card reached for it, so arriving there took sixteen deliberate selections instead of one click.

**Komorebi · Negative Fill · Waterline · Salt and Gold · Poolside Noon · Rim Light Confession · Light Through Water · Lido 1972**

Every one sets a Figure pose and a Color Logic relationship, deliberately. Those are the two axes with no equivalent in comparable tools, and a preset demonstrates them better than documentation does: *Achromatic Skin Chromatic Clothing* under hard overhead light is an instruction no other prompt board can express.

Three of the eight — Komorebi, Negative Fill, Waterline — were specified from the published vocabulary before they were built, and every value validated on the first pass.

## Restraint, applied to the old cards

Twelve of the twenty original cards set every axis available to them. That is a finished image, not a doctrine — and it matters more than it sounds, because applying a card clears every unlocked axis first. A card that specifies all seventeen leaves nothing to roll.

**42 assignments removed**, in three kinds:

- **Tautology.** Projection Cathedral stated its idea three times — medium *Projection Mapping*, lighting *Projection-Mapped Light*, wardrobe *Projection-Mapped Garment*. Wetware Archive put a *Macro Lens* beside a *Scanning Electron Micrograph*.
- **Weather on interiors.** All twelve set it, including a courtroom, a data centre, a sealed underground bunker and a kitchen. Eleven lost it.
- **Contradiction.** Field Artifact declared *Object-Centered Stillness* and then specified what a person was doing and wearing.

What stayed is what each card is *for*. Black-Site Angel keeps both *Surgical White and Arterial Red* and *Red as Administrative Signal* — one names the hues, the other says what the red means, and the pair is the card's whole thesis.

The twelve now set 12–13 axes and leave 4–5 open. Across all 28, the average is 13.

## The vocabulary is published as data

An agent pointed at Prompt Forge could reach the page and still not reach the signals. `index.html` is ~175 kB and the pools begin about 34 kB in, past where many fetchers truncate — and a model that gets a thin lookup fills in plausible signals from memory, which fails while looking like success.

- **`llms.txt`** — the front door: what this is, the seventeen axes, and the operating instruction.
- **`vocabulary.json`** — all 2,128 signals with axis metadata.
- **`vocabulary.txt`** — the same, flat, no parser required.

Both are generated from `index.html` by `npm run vocabulary`, and the audit regenerates them in memory and compares, so they cannot drift.

### Mirrors, because a blocked host is not a dead end

Some agents run fetchers that allowlist hosts and cannot reach `*.github.io`. That blocks `llms.txt` along with the data — the sentence explaining where else to look was itself behind the door it describes.

Every entry point now carries the mirror addresses at `raw.githubusercontent.com`, including `llms.txt` itself. Nothing here is gated; that is a host-level policy, not a restriction of this project.

Use `main` to operate the instrument. Pin a commit SHA for anything you intend to cite.

## Two agents, two fixes

Both changes to `llms.txt` this release came from watching cold agents use it, not from anticipating them.

One returned fifteen exact signals and one relocation: *Twilight*, a lighting signal, submitted as weather. The instruction said to use "only values that appear in the vocabulary," and Twilight does appear — the rule was underspecified. A signal is now valid only in the axis that lists it, and the file cites this exact failure. The same run filled all sixteen axes, so filling everything is now named as the signature of completing a form rather than making an image.

The other could not reach the host at all, and stopped rather than fabricating. That is the file working. It should not have had to stop, and now it does not have to.

## Verified

2,128 unique signals across 17 axes and 28 Forge Cards in the canonical banks, no duplicates within any axis, every axis a multiple of sixteen, every preset and prompt-order reference resolving. The running app carries more — `installDarpaCard()` appends its vocabulary on load, so the live board reports **2,167 signals and 29 Forge Cards**. Both counts are right; the audit measures the source.

Figure rerolls with the Story scope, a muted figure survives randomize, and pinned rows survive card application. The audit grew to fifteen checks this release, most of them guarding claims rather than code — every version string in the file must agree with `package.json`, the vocabulary files must match the application, and `llms.txt` must carry the mirrors.

## Why CC0

Unchanged. Take it, change it, give the changed thing away again — or do not. The gift has no hook in it.
