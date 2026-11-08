# Verification · 0.2.0

## Automated

`npm test` in `persona/`: **33 tests pass**. Coverage includes multi-archetype stacking, independent role pins and blank slots, cross-family combinations without compatibility rules, source-ID-safe starter expansion, legacy 1.0.0 migration, role removal and undo by stable ID, archetype JSON/Markdown integrity; pins and pinned blanks; individual and full rolls; exhausted and empty banks; case-insensitive banishment and restoration; bank editing; manual text preservation; origin versus approval; undo with later edits; all optional modules; unsupported and malformed imports; rights; local snapshots; deterministic Codify; and JSON round-trip integrity. The property-style edit sequence performs 75 export/import cycles. Distribution tests verify the generated HTML matches source and has no external runtime dependencies or connection calls.

The existing Image Prompt Forge’s root `npm test` also passes. Its application, banks, and vocabulary files were not changed.

## Archetype update observed in the browser

The existing 1.0.0 workspace loaded as 1.1.0 without invented roles or lost curation. The picker searched and combined roles across families, including the anime/dynamics family. A pinned role survived a full roll while another changed; a manual role edit survived undo. Archetype banishment and restoration worked. Explicit starter-bank expansion preserved the selected character object exactly. The multi-archetype JSON export → paste/import → export comparison was byte-for-byte equal. Reload retained the role stack and its independent pin. The archetype picker and character board fit a 375px usable viewport without horizontal overflow.

## Original prototype browser checks

| Scenario | Result |
| --- | --- |
| Enter identity and roll ten personality signals | Live preview reflects the selected data |
| Pin a trait, then roll | Pinned text remains unchanged |
| Edit a field after a roll, then undo | The later manual edit is preserved |
| Replace a descriptor bank, reroll, banish, restore | Custom values draw; banished value is excluded; restoration returns it |
| Set independent romance, erotic interaction, roles, boundaries, and change policy | All survive full character randomization |
| Save/load a named snapshot | Full saved character is restored; replaced workspace gets a recovery snapshot |
| Reload the page | Local workspace is restored |
| Invalid JSON import | Error displayed; current document unchanged |
| Download JSON, load it through the file chooser, and import | Import succeeds |
| Compare exported JSON before and after browser import | Exact string equality |
| Add Essence, Appearance, and Continuity; approve entries | Data appears in the preview and approval count |
| Narrow embedded viewport, 375px usable width | No horizontal overflow; controls reflow |

The Markdown document and manual-copy fallback were observed. This preview browser did not report completion of `.md` downloads, including from native download links; file-download completion for Markdown remains unverified. The links carry the generated Markdown Blob and an explicit `.md` filename. Clipboard access on the HTTP preview is unavailable, and the app correctly selects the output for manual copying. A private HTTPS publication was confirmed by the hosting service; its sign-in gate prevented an unauthenticated production-browser check.

No claims are made about Safari, Firefox, physical mobile devices, screen-reader behavior beyond semantic inspection, or long-term browser storage durability.
