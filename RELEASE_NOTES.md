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

- The harness now takes the last attribute-free `<script>` block, and additionally checks that `v5.js` parses.
- `npm run build` inlines `v5.js` into **`dist/prompt-forge.html`** — a genuinely self-contained file, which the previous distribution had not been since v5. The old `dist/prompt-forge-v4.0.0.html` is retired; a version baked into a filename goes stale on the next release, and this one had been stale for two.
- New checks enforce the invariants this release introduces: reroll scopes must be disjoint and must cover every axis, and the three rig states must derive correctly from lock and value.

## Verified

2,000 unique signals across 16 axes, 20 Forge Cards, all preset and prompt-order references resolving. Muted axes were driven through randomize, Forge Cards, cluster rerolls, strumming, Mutate 3, page reload, and a Blueprint round-trip, and stayed blank through all of it.

## Why CC0

Unchanged. Take it, change it, give the changed thing away again — or do not. The gift has no hook in it.
