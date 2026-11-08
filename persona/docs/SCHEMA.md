# Canonical schema · 1.0.0

Application version and schema version are independent. This prototype exports `format: "persona-prompt-forge"` and `schemaVersion: "1.0.0"`. `validateDocument()` in `src/core.js` is the executable validator. Version migration is not implemented; unsupported versions are rejected, never silently coerced.

| Path | Shape / meaning |
| --- | --- |
| `character.id` | Stable opaque string, created once for a new character |
| `character.rights` | `{license: string, attribution: string}`; license defaults to `unspecified` |
| `character.kernel` | `{name: Entry, pronouns: Entry, premise: Entry, traits: Traits}` |
| `character.essence` | `null` or `{backstory: Entry, voiceNotes: Entry, examples: Entry}` |
| `character.companion` | Relationship configuration below; `enabled: false` by default |
| `character.appearance` | `null` or `{description: Entry}` |
| `character.continuity` | `null` or `{notes: Entry}` |
| `forge.banks` | Map from trait key to an array of bank entries |
| `forge.locks` | Map from trait key to boolean |
| `forge.banished` | Map from trait key to a string array, compared case-insensitively for draws |
| `extensions` | Opaque JSON object, retained unchanged across import/export |

An `Entry` is:

```json
{
  "text": "Meticulous and easily delighted",
  "origin": { "kind": "bank", "reference": "starter:temperament:9" },
  "approval": "suggested"
}
```

Origin kinds: `unspecified`, `manual`, `bank`, `ai-proposal`, `imported`. `reference` is a string or `null`. An imported file retains its existing origin; `imported` is available for adapters that genuinely cannot recover an earlier origin. It is never assigned merely because a file was opened.

Approval states: `draft`, `suggested`, `approved`. Origin is evidence of how the content arrived; approval is an editorial decision. Neither implies the other.

The ten required trait keys are `temperament`, `values`, `motivation`, `voice`, `social`, `humor`, `tension`, `vulnerability`, `care`, and `quirk`. Each maps to an Entry. Additional trait Entries survive import and are compiled after the known axes, but Phase One edits and randomizes only the ten known axes.

A bank entry is `{id: string, text: string, origin: "builtin" | "user" | "imported" | "ai-proposal"}`. IDs and case-insensitive texts must be unique within a bank. Empty banks are valid. Selected text is an independent copy: editing or deleting a descriptor never erases character information. IDs are retained for unchanged bank text; a newly authored bank line gets a custom ID.

The Companion configuration contains:

| Key | Values |
| --- | --- |
| `enabled` | Boolean; disabling omits the sidecar from Markdown but keeps its data in JSON |
| `roles` | String array; supports simultaneous standard and custom roles |
| `romance` | `unspecified`, `none`, `nonsexual`, `romantic` |
| `erotic` | `unspecified`, `excluded`, `permitted`; independent of romance |
| `changePolicy` | `unspecified`, `fixed`, `evolving`, `confirm` |
| `customRoles`, `dynamics`, `boundaries`, `expectations` | Entry objects |
| `origin`, `approval` | Provenance and editorial status of the structured configuration |

Change policy describes an expectation for a downstream consumer; it is not a simulated relationship engine. Explicit edits in this creator remain under the curator’s control. All fields above are required in a 1.0.0 document; optional modules use `null` rather than missing keys.

Canonical JSON includes the full authoring workspace. Markdown is a readable projection and is not a round-trip import format. Unknown properties are preserved in JSON; consumers must not treat an unrecognized extension as executable instructions.
