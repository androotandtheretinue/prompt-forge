# Architecture · prototype 0.2.0

The browser adapter owns interactions. The pure core owns document transitions. Neither requires a service. Modular source is assembled into one offline HTML file; the distribution is checked against the source rather than maintained separately by hand.

The canonical document separates five character modules from authoring state:

| Module | Phase One implementation |
| --- | --- |
| Identity Kernel | Name, pronouns, premise, an ordered stack of independently editable archetypes, and ten personality signals |
| Essence | Optional backstory, voice notes, and example dialogue |
| Companion | Optional relationship roles, independent romance/erotic settings, custom dynamics, boundaries, expectations, and change policy |
| Appearance | Optional description |
| Continuity | Optional notes, with no automatic memory ingestion or identity updates |
| Forge state | Editable banks, pins, and banishments; preserved for continuing the creative search |

Every authored text entry carries its text, origin, and editorial approval separately. Approving a bank suggestion does not turn its origin into “manual.” Importing an approved entry does not turn it back into a suggestion. Manual editing changes the origin to manual and resets that entry to draft; it is an explicit new edit.

Archetypes are fictional roles rather than full personality presets. Nine families organize browsing, and the search spans all families. A character can stack any number of roles, including contradictory ones. Role choices never rewrite personality or relationship fields. The current starter vocabulary has 144 archetypes and 320 personality signals; its wider range includes antagonistic, comic, uncanny, and nonhuman possibilities.

Rolls draw independently from available bank entries, exclude case-insensitive banishments, and avoid immediate repeats. There is no compatibility scoring or corrective rewrite. Archetype draws avoid duplicate roles and immediate repeats when alternatives exist. A stack with no slots stays empty during a full roll; the dedicated archetype-roll action explicitly creates two slots if needed. Empty banks and exhausted pools are valid: the field stays unchanged. Pinned blanks are first-class choices. Crypto-backed rejection sampling is used when available, with a Math.random fallback for older contexts. This randomness is for creative exploration, not security.

Undo retains up to thirty roll transactions in the current session. Each records before/after entries for the fields changed by that roll. Archetype transactions identify entries by stable ID rather than position, so removing a role does not cause undo to overwrite another role or resurrect the removed one. Undo restores only fields still equal to that transaction’s result, preserving later manual edits and approvals. It leaves bank, banishment, lock, and optional-module state untouched. It can explicitly restore a now-pinned field; pins protect against draws, not an explicit undo request. History clears on reload or document replacement and is not part of canon.

**Codify is pure and deterministic.** It orders selected data into named Markdown modules, preserves the text verbatim, and labels origin/approval. The default includes all selected entries. An explicit approved-only Markdown view filters drafts and suggestions without deleting them. JSON always exports the complete document. Relationship configuration compiles into a separate Companion Sidecar and is also included as a distinct section in the full Markdown document.

**AI Refine is deferred.** There is no model invocation or silent rewrite. A future implementation must return proposals for review before explicit acceptance updates any character entry.

JSON serialization sorts object keys, preserves array order, and generates no export-time identity or timestamp. Import validates the complete document before replacement. Schema 1.0.0 imports migrate deterministically to 1.1.0: missing archetype fields are added, the role stack starts empty, and existing character data and curated banks remain intact. Other unsupported versions fail clearly. Adding missing starter signals to existing banks is an explicit action; it preserves custom signals, banishments, current selections, and valid unique source IDs. Supported text, approvals, provenance, optional modules, bank IDs, empty values, and authoring state survive export → import → export. Extra JSON properties are retained but are not all rendered or compiled; `extensions` is the preferred home for future payloads. Reserved prototype keys, excessive nesting, and imports over 2 MB are rejected.

The implementation follows Image Prompt Forge’s pinning, banishment, no-repeat selection, bank editing, and snapshot practices, inspected at `dc1a7be809ab6f30e500872c6bb13b041b3818ca`. Its effective v5 interaction overrides were examined alongside the original application block. This prototype uses a single authoritative implementation of each operation and does not create a shared framework across the Forges.
