# Contributing to Prompt Forge

Thank you for helping the forge become stranger, sharper, and more useful.

## The easiest contribution

Open an issue with:

- the category;
- the proposed signal or card;
- one sentence explaining what it adds that existing language does not;
- an example subject, if useful.

## Editing the app

Prompt Forge ships as a single file, but since v5 the source is two: `index.html` holds the signal banks, the static foundation, and the prompt builder; `v5.js` layers the interaction model on top by reassigning the functions it replaces.

1. Fork the repository.
2. Edit `index.html`, `v5.js`, or both.
3. Run `npm run build`. This inlines `v5.js` into `dist/prompt-forge.html`, the self-contained file people download. The filename carries no version number on purpose — the old `dist/prompt-forge-v4.0.0.html` convention went stale the moment the version moved.
4. Run `npm test`.
5. Open a pull request describing the creative capability added or the failure removed.

### Which file to edit

`v5.js` reassigns `renderCategories`, `randomizeAll`, `mutateRandom`, `pickRandomOption`, `captureConfiguration`, `applyConfiguration`, and others. When a function exists in both files, the `v5.js` version is the one that runs — but keep the `index.html` version working too. It is the fallback when the layer fails to load, and it is what `npm test` executes.

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
- `dist/prompt-forge.html` matches the output of `npm run build`.
- No analytics or prompt-upload behavior is introduced without conspicuous disclosure and community discussion.

## Licensing contributions

By contributing, you agree to dedicate your contribution under the repository's [CC0 1.0 Universal](LICENSE) terms to the extent legally possible.
