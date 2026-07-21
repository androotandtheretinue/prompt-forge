# Contributing to Prompt Forge

Thank you for helping the forge become stranger, sharper, and more useful.

## The easiest contribution

Open an issue with:

- the category;
- the proposed signal or card;
- one sentence explaining what it adds that existing language does not;
- an example subject, if useful.

## Editing the app

Prompt Forge deliberately stays close to a single-file architecture.

1. Fork the repository.
2. Edit `index.html`.
3. Mirror the finished release file to `dist/prompt-forge-v4.0.0.html` when preparing a patch for 4.0.0.
4. Run `npm test`.
5. Open a pull request describing the creative capability added or the failure removed.

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
- Locked categories remain unchanged by every automated operation.
- `index.html` and the versioned file in `dist/` remain identical for a release.
- No analytics or prompt-upload behavior is introduced without conspicuous disclosure and community discussion.

## Licensing contributions

By contributing, you agree to dedicate your contribution under the repository's [CC0 1.0 Universal](LICENSE) terms to the extent legally possible.
