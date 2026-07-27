# Contributing to Prompt Forge

Thank you for helping the forge become stranger, sharper, and more useful.

## The easiest contribution

Open an issue with:

- the category;
- the proposed signal or card;
- one sentence explaining what it adds that existing language does not;
- an example subject, if useful.

## Editing the app

Prompt Forge is one file. `index.html` is the whole program: signal banks, styles, application, and interaction layer. There is no build step and no distribution copy of the app to keep in sync.

1. Fork the repository.
2. Edit `index.html`.
3. If you changed any signal pool, run `npm run vocabulary`.
4. Run `npm test`.
5. Open a pull request describing the creative capability added or the failure removed.

### The social card

`social-card.png` is the link preview. Regenerate it whenever the board's appearance or the version in the header changes, using an installed Chrome or Edge — no dependency required:

```
chrome --headless=new --disable-gpu --hide-scrollbars \
  --virtual-time-budget=8000 --window-size=1200,630 \
  --screenshot=social-card.png index.html
```

The audit checks that the file exists, that `og:image` is absolute, and that `twitter:card` is set. It cannot check whether the picture still resembles the board — that part is on you.

### The published vocabulary

`vocabulary.json` and `vocabulary.txt` are generated from `index.html` and committed, because GitHub Pages serves files rather than running scripts, and machine readers need the vocabulary as data. `npm run vocabulary` also embeds `llms.txt` verbatim into the `<head>` of `index.html`, so an agent that fetches the page it was pointed at already has the protocol. Edit `llms.txt`; never edit the embedded copy.

This is a deliberate and narrow exception to the rule that killed `dist/`. That directory duplicated the entire application and drifted silently for two releases. These files duplicate only the signal pools, and `npm test` regenerates them in memory and compares — so drift is a failing test, not a quiet inaccuracy. Regenerate rather than hand-edit; a hand-maintained copy of 2,032 strings is a copy that will eventually lie.

A stale vocabulary file is worse than none. It looks authoritative, gets cached publicly, and produces prompts referencing signals the forge does not have.

### The two script blocks

`index.html` contains two inline `<script>` blocks, and the distinction matters.

The **first** holds the signal banks, the Forge Cards, the prompt builder, and the original application. The **second** is the v5 interaction layer — strumming, custom pools, and the crypto-backed randomness — which runs afterward and *reassigns* several functions from the first block in place: `renderCategories`, `randomizeAll`, `mutateRandom`, `pickRandomOption`, `captureConfiguration`, `applyConfiguration`, `updateOptionCount`, and others.

Where a function exists in both blocks, **the second one is what actually runs.** Editing only the first copy produces code that looks correct, passes review, and never executes. Keep the first definition working anyway — it is what `npm test` executes.

The second block also calls `installDarpaCard()` on load, which appends signals to the built-in category arrays and adds a 21st Forge Card at runtime. Anything counting signals from the source alone will therefore report fewer than the running app has.

## Signal design

A strong option should:

- produce a visible or narratively useful difference;
- be specific enough to steer without becoming a whole prompt by itself;
- avoid duplicating an existing option under a synonym;
- remain useful across many subjects;
- use concise title case consistent with its category;
- preserve tension when tension is more generative than perfect coherence.

## Forge Card design

A Forge Card is a doctrine, not a random sample. Its selections should reinforce one another while leaving enough room for the subject to matter. Every selected value must exist verbatim in its corresponding category.

## Pull-request checks

- No duplicate options within a category.
- No broken preset references.
- Every category appears once in prompt order.
- Every category appears in exactly one reroll cluster. Clusters must partition the axes: overlapping scopes make the cluster buttons indistinguishable, and an uncovered axis is one no cluster button can reach.
- Locked categories remain unchanged by every automated operation, whether they are pinned at a value or muted blank.
- `index.html` loads no local script or stylesheet file. It must stay a single self-contained document. The `rel="alternate"` pointer to `vocabulary.json` is not a render dependency and does not violate this.
- `vocabulary.json` and `vocabulary.txt` match `index.html` exactly, and `llms.txt` points at both.
- Every axis is sized to a multiple of sixteen.
- No analytics or prompt-upload behavior is introduced without conspicuous disclosure and community discussion.

## Licensing contributions

By contributing, you agree to dedicate your contribution under the repository's [CC0 1.0 Universal](LICENSE) terms to the extent legally possible.
