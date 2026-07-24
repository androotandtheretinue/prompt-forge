# Prompt Forge 5.2.0 — Signal Rig

Sixteen strings. You do not play all sixteen on every song.

Prompt Forge 5.1 made the board playable. 5.2 makes it configurable before you play: choose which axes are in the instrument, and the rest go quiet and stay quiet.

## The Signal Rig

Every axis now sits in one of three named states, shown as a chip strip above the board:

| State | Meaning | Behavior |
| --- | --- | --- |
| **live** | in play | rerolls, cards, strums, and randomize may move it |
| **pinned** | frozen at a value | survives every automated operation |
| **muted** | frozen blank | contributes nothing to the prompt, and stays that way |

Tap a chip to cycle `live → pinned → muted`. The readout counts the three as you go.

Three bulk controls set the whole rig at once:

- **🚫 MUTE BLANKS** — mute every axis that is currently empty. Randomize at RECON, keep the six that landed, mute the ten that did not, and the board is now a six-string instrument.
- **🔐 PIN FILLED** — pin every axis that currently holds a value.
- **🔓 ALL LIVE** — release everything. Values are kept.

The rig is the deliberate counterpart to the payload doctrines. RECON gives you a random six; the rig lets you choose the six.

### No new state

The three states are a reading of two properties the forge already stored:

```
live   = !locked
pinned =  locked && value !== ''
muted  =  locked && value === ''
```

Which means Blueprints, local persistence, and every lock guard in the v5 layer understood muting before it had a name. Save a rig to the Blueprint Vault and it travels with the rest of the configuration.

Muting was technically possible before this release — clear a row, then lock it. Nothing said so, the two steps only worked in that order, and the result was styled identically to a pinned row. The capability existed and could not be found. Now it is one tap, and a muted row reads slate instead of gold.

## The four cluster buttons now mean four different things

They were unclear because they were nearly identical. Structure and Story shared three of their four rows:

```
before   structure : action, framing, composition, setting
         story     : action, composition, setting, narrative
```

The reroll scopes now partition the sixteen axes — every axis in exactly one scope, no axis in two:

```
after    structure  : composition, camera, setting        the shot
         atmosphere : lighting, mood, palette, weather    the air
         surface    : medium, texture, style, quality, fx, color logic
         story      : story signal, action, wardrobe      who, and what happens
```

Color Logic belonged to no cluster at all and could not be reached from any cluster button. It now lives in Surface.

Two smaller corrections to the same problem:

- Every cluster button is prefixed with **⟳**. The labels were nouns; the action is a verb.
- **Hovering a scope outlines the rows it will change**, in both the board and the rig strip, before the click commits. The button titles list their member axes and are generated from the actual cluster definition, so a label cannot drift from what it does.

## Repo catches up to the code

5.2 is also the release where the project's release discipline rejoins reality.

The audit harness had been failing since v5 shipped, and worse than failing — it had verified nothing. It extracted the application with a pattern anchored on `</script></body>` that started matching at the first inline block. Adding the `<script src="v5.js">` tag made it swallow that markup as JavaScript, so the harness could not parse the file it was testing.

The signal counts held anyway. They held unwatched.

- The harness now selects the application block by its contents rather than its position, and parse-checks every inline block. Position is exactly the thing that kept changing.
- **`v5.js` is folded back into `index.html`.** The project called itself single-file for two releases while shipping two files. It is one file again — open it straight off disk and it runs. A new check fails the build if any local script or stylesheet reference reappears.
- `dist/` and the build step are gone. With `index.html` self-contained there is nothing left to mirror, which permanently retires the class of bug that produced the stale distribution.
- New checks enforce the invariants this release introduces: reroll scopes must be disjoint and must cover every axis, and the three rig states must derive correctly from lock and value.

## Verified

2,000 unique signals across 16 axes and 20 Forge Cards in the canonical banks, with every preset and prompt-order reference resolving. The running app carries more than that — the v5 layer's `installDarpaCard()` appends its vocabulary to the built-in pools on load, so the live board reports **2,039 signals and 21 Forge Cards**. Both numbers are correct; they count different things, and the audit measures the source.

Muted axes were driven through randomize, Forge Cards, cluster rerolls, strumming, Mutate 3, page reload, and a Blueprint round-trip, and stayed blank through all of it. The merged file was also opened directly from disk over `file://`, with no server and no network, and ran clean.

## Why CC0

Unchanged. Take it, change it, give the changed thing away again — or do not. The gift has no hook in it.
