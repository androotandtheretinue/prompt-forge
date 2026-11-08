# Persona Prompt Forge · 0.2.0

A local-first character workbench by Root & The Retinue. Roll possibilities, pin discoveries, and carry a character between tools. This is a separate Forge Suite instrument, not a template that turns every character into the Retinue.

## Run it

Open **`index.html`** in a modern browser. That file is the complete application, including its styles, code, and starter banks. It works offline, without installation, an account, an API key, or a backend.

For a consistent browser-storage origin during development:

```sh
cd persona
python3 -m http.server 5173
```

Open `http://localhost:5173`. The server only serves application files; character data stays in the browser. A private hosted edition can serve the same HTML. Hosting does not add character synchronization.

## Use it

1. Enter a name, pronouns, or premise if you have them. They are never randomized.
2. Browse **144 fictional archetypes** across nine families, stack several, or invent your own. Each archetype has its own pin, reroll, banish, and approval controls. New characters start with two blank slots; add or remove slots freely.
3. **Forge persona** rolls the ten personality fields and all unlocked archetype slots. **Alt+R** does the same. **Roll archetypes** explores just the role stack.
4. Pin discoveries, including intentionally blank traits. Use each field’s die for a single reroll, **⊘** to banish its current value, and **≡** to edit its descriptor bank.
5. Type directly over any field. Pins stop randomization; deliberate manual edits remain available. A manual edit becomes a draft. A roll becomes a suggestion. Use the adjacent status selector to approve either without changing its origin.
6. **Undo roll** restores recent draws while preserving later edits and approvals. It does not undo bank edits, pins, relationship changes, or banishment decisions.
7. Add optional Essence, Relationship, Appearance, or Continuity information. Relationship settings start unspecified and never participate in rolls.
8. Save named snapshots under **Saved sketches**. **Codify / export** provides canonical JSON, readable Markdown, and a separate Companion Sidecar.

The current workspace autosaves locally. Named snapshots include the complete document, banks, pins, and banishments. Loading a snapshot saves the workspace being replaced first. Beginning a new character or removing an optional module also saves a recovery snapshot first. If that snapshot cannot be saved, those actions stop and explain the failure.

Export JSON for backups and moving between devices or browser origins. Browser storage can be cleared, and `file:` storage behavior varies by browser. Schema 1.0.0 saves migrate to 1.1.0 with no invented archetypes and with their curated banks preserved. Use **Add latest starter signals** to explicitly merge the broader starter vocabulary into an older or customized workspace. A valid JSON import replaces the current workspace; invalid or unsupported documents leave it untouched. The importer tells you to save the current sketch first.

## Develop and verify

Node 20+ is sufficient; there are no npm dependencies.

```sh
cd persona
npm run build
npm test
```

Edit `src/`, then rebuild. `index.html` is generated and committed so it can be downloaded and opened directly. The distribution test fails if it drifts from the source.

| File | Responsibility |
| --- | --- |
| `src/banks.js` | 320 original personality signals across ten axes |
| `src/archetypes.js` | 144 fictional archetypes across nine browsing families |
| `src/core.js` | Canonical documents, validation, rolls, undo, Codify, and local-store adapter |
| `src/app.js` | Browser controls, accessible dialogs, live preview, and downloads |
| `src/shell.html`, `src/style.css` | Interface and responsive layout |
| `tools/build.mjs` | Deterministically assembles the self-contained distribution |
| `tests/` | State integrity and distribution tests |

Read [architecture](docs/ARCHITECTURE.md), [schema](docs/SCHEMA.md), and [deferred work and decisions](docs/DECISIONS.md).

## Privacy and rights

The application contains no telemetry, upload, fetch, or AI-service connection. It loads no remote fonts, scripts, or styles. Its Content Security Policy blocks application connections. The only persistence is browser local storage; exports are user-initiated local downloads or clipboard copies. A static host may have ordinary request/access logging, but the application does not place character content in requests or URLs.

Original application materials and starter descriptors are dedicated under **CC0 1.0 Universal**; see [LICENSE](LICENSE). A user’s characters, imported banks, and contributed content do **not** inherit that dedication. Character rights default to `unspecified` and travel in JSON and Markdown.
