Changelog
All notable changes to Prompt Forge are documented here.
[Unreleased]
Fixed
Fixed the output format buttons on a phone. As a wrapping flex row the fourth button took a line to itself and stretched to fill it, so BOORU rendered 309px against 90–106px for the other three — three times the target for the option that is not three times more likely. All four are now one grid at equal width. A wrapping row cannot express "these are equal options" once the count stops dividing into the width; a grid can, and does not care whether a fifth format ever arrives. Size is left to mean how important a choice is rather than which one is selected, which the active outline already says.
Fixed the global controls stacking on a phone: the primary button wrapped its own label onto two lines while each of the three secondaries took a whole row. RANDOMIZE keeps a full row, the rest pair up, and the trimmed padding stops CLEAR UNLOCKED wrapping. The block went from 224px to 162px.
The per-format subject override takes two lines on a phone, like the category rows — tag and buttons above, field full width below. On one line the field was down to about 145px, which is not enough to read a subject you are editing.
Both grid rules carry `!important`, and the audit checks that they do. The Tailwind CDN generates its utilities at runtime and appends them after the page stylesheet, so `.flex` and a later `display: grid` tie on specificity and source order hands it to Tailwind — without it the rules parse fine, read correctly in the file, and do nothing in the browser.
Corrected the file size llms.txt quotes when telling agents not to scrape index.html for the vocabulary. It claimed 274 kB and about 73 kB to the first signal pool; the file is now 310 kB with the pools starting around 81 kB. The argument was right and its numbers had drifted two releases behind it.
Fixed BOORU mode putting two subjects in every prompt. The scaffolding carried a SUBJECT TAGS field defaulting to `1girl, solo`, prepended unconditionally, while the board's own subject went in immediately after it — so a prompt about a cracked helmet on a fencepost came out as `masterpiece, best quality, 1girl, solo, a cracked helmet on a fencepost, ...`. Two subjects, adjacent, contradicting each other, on every booru prompt the tool had ever built. The field was the one thing in that object the board already had somewhere for.
The subject now enters booru tag space lowercased like every other tag, instead of sitting in Titlecase among them.
Fixed `setMode` knowing about only three of the four output formats. It toggled three buttons by name and had never heard of BOORU, which lit only because the general sync ran from somewhere else. It now delegates, so adding a format means editing one list rather than finding every place that enumerates them.
Added
Added per-format subject overrides. The subject stays shared and each output format may optionally override it; a format with no override of its own uses the shared subject. Universal, Midjourney and SDXL want the same sentence — a lighthouse keeper is a lighthouse keeper in all three, and flipping between them to compare dialects is a reason to use this at all. A booru checkpoint wants a count declaration, `1girl, solo`, which is not that sentence translated but different content. Only the format that needs different content carries an override; the rest fall through and keep the comparison honest.
This is what replaces the deleted SUBJECT TAGS field. An override substitutes for the subject rather than sitting in front of it, so the duplicate cannot recur — and the audit now asserts that an assembled booru prompt contains its subject exactly once.
The override strip names the format it is editing and lights up only while that format is actually overriding, since it is present in every mode and its resting state has to read as doing nothing. Blueprints saved before this release have their `booruSettings.subject` read into the booru override rather than dropped, because those saves were built around that tag being present.
Added a subject pool per output format, with the same bulk import the axes just gained. A subject worth saving is nearly always worth saving for one dialect — `1girl, solo` is a good booru subject and noise in a Midjourney prompt — so one shared list would put both in front of you every time and leave the sorting to memory. Saved subjects appear as chips under the field; clicking one sets the override for the format you are in.
Added bulk import to the custom pool editor. A paste box takes a list separated by newlines or commas — both, because that is how a person writes a list and how a booru tag string arrives — and reports what it added alongside what it refused as already present. The single-entry field was the only door in, which quietly capped how much vocabulary anyone could bring to a board that already lets custom signals join every roll, strum, Radar sweep and Blueprint.
Added export and import of every custom pool at once, as JSON keyed by axis. A vocabulary becomes a portable object rather than browser state, so a set tuned for one checkpoint can be shared, versioned, or swapped for another. Export writes into the same box import reads from, so what you are about to hand someone is on screen rather than in a file you have to go and open.
Import merges by default; ticking replace empties every custom pool first, not only the axes the file names — otherwise the board ends up running a mixture of two vocabularies with no way to tell which one gave you a word. Any unlocked row left showing a signal that no longer exists is cleared. Locked rows are left alone, since a pin is a promise.
Deduplication is case-insensitive and judged against the whole combined pool, so an import cannot shadow a built-in signal with a differently-cased copy of itself. Two entries that read identically but are not equal is the worst state a pool can be in, because nothing about the interface reveals which one a roll produced.
A malformed file changes nothing at all and says why. Unknown axes and known axes holding something that is not a list are reported as separate complaints, because they are.
The rules — how a list is split, how duplicates are judged, how a pool object is parsed — live in the application block rather than the interaction layer, so the audit can execute them rather than pattern-match the source. It checks both halves: that the functions are there, and that the interaction layer actually calls them instead of growing its own copy.
Added BOORU output for Danbooru-tagged checkpoints — Illustrious, NoobAI, WAI, Pony. Camera position, pose, garment, place, light, weather and texture have genuine tag equivalents and are translated; everything else is passed through as prose, which those checkpoints still read, less precisely. The panel names which axes reached tag space and which are riding along as text, so you can see which half of the prompt the model is actually keyed to.
The quality axis is deliberately unmapped in this mode. It says "8K Resolution, Tack Sharp"; a booru checkpoint wants "masterpiece, best quality, absurdres" — the same job in a different language with no correspondence, so the axis steps aside for editable scaffolding rather than being mistranslated.
Added editable BOORU scaffolding: quality prefix, subject tags, trailing tags and negative, defaulted to what Illustrious-family checkpoints expect and saved with Blueprints. A subject count tag is close to mandatory on those models and the board has no axis for it.
Added audit checks that every booru mapping still points at a signal in the live vocabulary, that tags are lowercase and space-separated rather than Danbooru's underscore form, and that the quality axis is never mapped. The check caught two invented weather keys on its first run.
Changed
Shift now means the same thing on every surface. It surveys — on a click, on a row's dice, and now on a strum, where each row the drag crosses draws from what it has not shown you yet. Step-strum moved to Ctrl, which is the modifier it should have had once Shift acquired a meaning everywhere else.
Banking is unavailable to a strum, by design. A click refuses one signal; a drag down the board refuses seventeen in a second and a lane sweep refuses hundreds. Surveying at that speed is free because release undoes it — banishing at that speed is a permanent decision made by a gesture built to be careless. Holding the banking modifier while dragging surveys instead of banking, so the gesture is not refused, only its permanence.
Added
Added a bank: hold Ctrl+Shift (or Cmd+Shift) while rerolling and every signal rolled past is banished rather than merely set aside. Banked signals are filtered from every draw whether or not a key is held, and stay out until released. Shift records looking and clears when you let go; Ctrl+Shift records deciding and does not.
Added the BANISHED SIGNALS panel, listing everything banked grouped by axis. Each entry is its own undo and one button empties the lot. A store the board keeps honouring must be readable and reversible, or it becomes a haunting — the pool quietly smaller every month with nothing to point at.
The bank persists across sessions, like custom pools and unlike a strum, because it records a decision rather than a gesture.
The bank refuses to take an axis below two remaining signals. A survey rescues itself on release; a permanent ban has no such moment, and an axis refused down to nothing would stay unrollable and read as a broken board rather than an obeyed one.
The roll controls report which mode is armed: ⚱ while banking, ⚗ while surveying, 🎲 at rest, with per-axis counts on each row's dice.
Added elimination to rerolling: hold Shift and every value rolled past is set aside, so each draw comes from what remains. A plain reroll samples with replacement and only refuses the value already on screen, which on a 176-option axis shows you the same handful all afternoon — good for stumbling onto something, useless for surveying. Release and the whole pool returns.
The state is transient by design: not saved to Blueprints, not persisted, cleared on release and on window blur. It records an act of looking rather than a decision, and a survey resumed an hour later is a different survey.
Exhausting an axis restarts its sweep rather than deadlocking. A pool with no candidates left would silently stop responding, which reads as a broken button rather than a completed pass.
Every reroll control eliminates, not just the roll-all button: the per-axis 🎲, cluster scopes and the strum lane all run through the same draw. Each row's dice reports its own count while the key is held and switches to ⚗ once it has set anything aside, and the roll-all button reports the total. Elimination applied to all of them from the start, but only the roll-all control said so — and a capability that is silent on the button that has it is indistinguishable from one wired to the wrong button.
Added a station log to the head of `index.html` and esoteric epigraphs under every section banner — alchemical sigils, runes, hexagrams, Cyrillic, kana, Roman numerals. Decoration, addressed to whoever opens the source. The log ends by saying which comments are load-bearing and which can be deleted, because the joke should not cost the next reader an afternoon.
Added an audit check refusing bidirectional overrides, zero-width characters and stray byte-order marks. Every legible script is welcome; characters whose only function is to make source read differently than it runs are the Trojan Source class and are refused by name.
Renamed the project's public identity. It is Prompt Forge, subtitled Distributed Axis Randomization & Prompt Assembly. The agency name no longer appears on the title, the Open Graph and Twitter titles, the page header, or the footer — the initials of the subtitle still spell it, and that is the joke, but a reader finds it rather than being told. Spelling it out is what would turn an easter egg into an implied affiliation.
Renamed the DARPA Forge Card to PHOSPHOR, after the phosphor-terminal aesthetic it actually describes. Its two signal values, DARPA Scan Lines and DARPA Interface, deliberately keep their names: a value inside a 2,304-item vocabulary reads as a citation, and renaming them would silently blank those axes in every saved blueprint that used the card, since applyConfiguration drops any value no longer in its pool.
Added an audit check that no brand surface names a federal agency, and that the subtitle is present.
Removed the version from the fallback header in the first script block, which had read "DARPA v4.0" for three releases. The v5 layer overrides that function, so the string only rendered if the layer never ran — a number nothing could see and nothing could derive. It now states the counts it can compute and no version at all.
Fixed two stray control characters in the audit's regexes, left by an editing pass that wrote `` into a non-raw string and produced a literal backspace byte. One of them silently disabled the static-footer version check.
Reordered the mobile layout so the board comes first. The rows sat 2,231px down a 5,583px page — three screenfuls of panels that tune the instrument before one row of the instrument itself. Subject, the randomize controls and the axes now come first; mission doctrine, the chaos dial, output format and the signal rig follow the board. The order is declared per section rather than by position, and the default places anything unlabelled below the board rather than above it.
Compressed the mobile category row from 148px to 89px by putting identity and controls on one line and the value beneath at full width. Nine axes fit on a phone screen instead of five and a half. The buttons were left at 28px rather than shrunk further; below that the density is bought from the thumb.
Added a horizontal strum strip above the board on mobile, since a vertical drag on a phone is the scroll gesture. It carries `touch-action: pan-y`, so a vertical swipe passes through to the page and only sideways movement strums. Position still means axis — read off X instead of Y — and one sideways rake plays all seventeen.
Kept every curation feature on mobile. Locks stay inline on each row because roll-then-pin-what-lived is the loop, and randomising without pinning is a slot machine rather than a lighter version of the same instrument.
Added a strum lane down the left of the board. Strumming already worked by dragging across the category labels — the same gesture, but you had to know it, and the surface you dragged on was also the surface you clicked to make careful choices. The lane gives the careless motion somewhere of its own: it runs the height of the board, and dragging down it rerolls whichever row you are level with. Height means axis, so a slow drag walks the axes in order and the same drag played twice does the same thing. Shift still steps instead of randomizing, pinned and muted rows are never touched, and arrow keys plus space reach the same behaviour without a pointer. Hidden below 640px, where there is no gutter to spare and dragging across the rows still works.
Fixed the strum hint's insertion point. Giving the category panel a flex parent silently changed what `categoriesPanel.before(...)` meant: the hint moved from above the board to beside it as a third column, and the board shrank to make room. Nothing errored. The audit now asserts the arrangement.

[5.4.0] — 2026-07-30
Added
Gave the chaos dial teeth. It appended an adjective and called that chaos — a promise the prompt could not cash, since nothing about the output looked wilder at 90 than at 10. It still appends the adjective, and now also damages the signal text itself, which is chaos you can read before you generate.
Four ticks on the meter, each naming the worst thing that can happen past it: DRIFT at 25 (semantic variants — Golden Hour becomes Borrowed Golden Hour, meaning bent, token intact), MISSPELL at 50, LEET at 75, and ZALGO at the last tick only. The zones are cumulative rather than exclusive, so a high setting yields a mix of clean, drifted, misspelled and eaten signals — uniform corruption reads as a filter and breaks every prompt the same way.
Locked signals are immune, following the rule that a pin survives cards, radar, clearing, mutation, strumming and randomize. Pin the subject and the medium, then let chaos eat the periphery; a dial that can consume your anchor is a hazard rather than an instrument.
Corruption is seeded and the seed is saved in Blueprints, so a dial setting is reproducible. Chaos you cannot repeat is neither shareable nor testable.
The wound is shown: every corrupted signal is listed with its original struck through beside what became of it, coloured by tier. A tool that silently rewrites your choices is not one you can trust, and at high settings the damage is the product.
Diagnostics warn only in the zalgo zone, where combining marks can exceed model tolerance or break Midjourney parameter parsing. Everything below the last tick is plain text that survives all three output formats, which keeps the warning meaningful when it fires.
Told `llms.txt` that corrupted signals are deliberate and must not be repaired downstream. Most models will silently fix a misspelling in passing, which discards the choice and returns an image nobody asked for.
Added 176 signals across eleven axes, closing the clustered gaps an outside audit of the published vocabulary found. The holes were grouped rather than scattered, which is the useful kind: a missing signal is an inconvenience, a missing territory is a genre the board cannot enter. The Western had no on-ramp anywhere — no frontier town, no duster, no Western in style. Performance had actions with no world: Performing on Stage and Conducting an Orchestra existed while theatre, footlights and dancewear did not. Celebration could be infiltrated but not thrown. And nothing rode anything — 160 actions with no riding, driving, rowing, sailing or surfing, which survived a release that added sixteen swimsuits. Setting also gains the plain versions of places it only held estranged (Hospital Ward beside Hospital Without Staff, Courtroom beside Courtroom for Nonhuman Persons), because tilting the ordinary should be the user's choice and cannot be made from a bank holding only the tilted one.
Single absences closed: Afrofuturism (Afro-Surrealism and Queer Futurism had shipped without the parent term), Mannerism (Neo-Mannerism had shipped without its parent), hail, a plain rainbow beside the Double Rainbow, selfie and video-call framing, trio and ensemble composition, terrazzo and corduroy, and marker, ballpoint, crayon and pyrography in medium.
Fixed the static page header, which read "DARPA v4.0 · 2000 Options" for three releases. JavaScript rewrites it on load, so in a browser it was always right and nobody read the markup — but markdown converters strip the script, making the stale markup the only version a large class of agent sees. An outside audit of the live page reported the version as v4.0.0 for exactly this reason.
Added audit checks for the static header's version and count, and a sweep over every signal count stated anywhere in the markup. Three meta descriptions were two releases behind, in the first kilobyte, which is the part a truncating fetcher is most likely to keep.
Embedded `llms.txt` verbatim in the application page, so one fetch of the URL people actually share is enough. It lives in a collapsed `<details>` disclosure beneath the header: closed text rather than hidden text. Hidden rendered content is a cloaking pattern search engines penalise, and a visually-hidden element reachable by screen readers would recite ten kilobytes of machine instructions to someone who did not ask for them; a disclosure is ordinary content a human can open, a screen reader announces as collapsed, and — the reason it is not a script block — an HTML-to-markdown converter keeps.
Moved the embed out of an inert `<script type="text/plain">` after a Claude instance fetched the page and reported the block stripped during markdown extraction. Converters drop every script regardless of type, along with styles, comments and usually the head, so a protocol present only in markup reaches only the readers that parse markup. Verified against a simulated extraction: the protocol, the axis glosses, the output contract and the worked example all survive, appearing 1.4 kB into the extracted text.
Added an audit check that opening and closing script tags balance. The comment explaining the embed originally spelled out a literal script tag; balanced parsers ignore comments, but the regex-based strippers extraction pipelines use matched from that text to the next closing tag and swallowed the protocol. The explanation broke the thing it explained, and nothing rendered differently, so only a count catches it.
Added pin and mute operators to each cluster scope. A scope previously only rerolled; it now carries the same three verbs a single row does, so what you can do to one axis you can do to four at once. Muting Story holds narrative, action, figure and wardrobe blank through every operation, which is how you build an image that carries no story at all.
Both operators are toggles — clicking the engaged one returns the scope to live, so no scope can be stranded held.
Locking a scope that contains a blank row holds that row blank rather than refusing, matching the existing rule that locking an empty row presents as muting it.
Cluster operator titles are generated from live membership and current state, so a label cannot drift from what the button does.
Split `llms.txt` into a PROTOCOL and a LEXICON, protocol first. The axes, selection rules, output contract and image-handling are the portable machine-readable architecture and now live entirely in that one file; the curated vocabulary is named as an optional human-discovery layer. An LLM already carries broad visual vocabulary — what it lacked was the structure.
Each axis now carries a one-line gloss, so an agent can fill `colorlogic` or `figure` from its own knowledge. The key alone was not enough to act on.
Replaced "if you cannot reach the vocabulary, say so and stop" with a fallback: fill from your own knowledge and report the mode. Three modes are valid — canonical, protocol, mixed — and naming the mode is required, since a model-supplied value is a good prompt and a false citation.
Stated that the prompt is always the deliverable and that image generation is additional, never a substitute: generate if you can, otherwise delegate, otherwise (on X) ask Grok, otherwise return the prompt alone.
Stated that the agent supplies the idea and subject itself unless given them. An agent reported the protocol internalised, then asked for an idea and waited; supplied one, it returned an image and nothing else. Being asked to use Prompt Forge is being asked to make something, not to collect requirements — the first reply is the work.
Fixed the audit's prose checks, which matched single-line strings against a hard-wrapped file. Any required sentence longer than a line was split by a newline, so the check would have failed on a reflow rather than on a removal — a check that cries wolf about formatting and stays silent about substance. Prose assertions now run against a whitespace-normalised copy, verified by reflowing the whole file at a different width and re-running.
Asked for the axis count to be checked rather than merely stated. An agent produced a correct-looking Blank list with one axis missing from it — sixteen accounted for out of seventeen, palette simply gone. `llms.txt` now says to count before sending, and names palette and colorlogic as the two most often lost.
Singled out the assembled prompt as the part that must never be absent. The same reply returned the idea, subject, axes and mode, and no prompt — four parts of five, missing the only one that is the deliverable rather than a description of it.
Made the output contract survive follow-up turns. An agent that had just produced a fully compliant reply was asked for "one more" and returned prose and an image with no axes at all — it did not refuse the protocol, it stopped treating the exchange as one. A follow-up reads as conversation, and conversation is where a fetched instruction goes quiet. `llms.txt` now states in its opening lines that every reply returns all five parts including follow-ups, and repeats in the output section that a second request is a second prompt.
Moved a one-paragraph summary of the output contract to the top of the file, above the axis list, so an agent that skims meets the contract before the detail.
Required that every axis be considered and every blank reported. An agent filled five axes and said nothing about the other twelve, and in the output a deliberate omission and a pass that simply stopped early are indistinguishable. Selection now says to go through all seventeen and decide each one; the output contract requires naming every blank axis so filled and blank come to seventeen, with reasons welcome and never required. Listing the blanks is the only evidence restraint happened rather than inattention.
Established in `llms.txt` that the subject is separate from the axes and comes first. The app has kept the subject in its own field since v4 and puts it at the head of the prompt, but the machine-facing document described only the axes — so an agent with a character to place had nowhere to put it. One wrote the character into `figure`, which is for how a body is arranged rather than whose body it is. The output contract now has five parts rather than four, and the `figure` gloss says explicitly that it is not the subject.
Made compliance falsifiable. An agent asked to use the board returned an idea and an image with no axis lines, then answered a challenge by asserting it had selected from the categories — a claim nobody could check. `llms.txt` now states that a reply without the axis lines is not a Prompt Forge result whatever was chosen internally, and that a challenge is answered by reprinting the axes rather than by describing the process.
Added a worked example of a compliant reply — ten axes shown, seven named as omitted, with the mode labelled. Agents pattern-match on a concrete shape far more reliably than they follow prose rules, and it demonstrates restraint and mode-labelling in the same twenty lines.
Added audit checks that `llms.txt` keeps its PROTOCOL and LEXICON sections, describes every axis the app defines, still says the prompt is always returned, and carries both the worked example and the not-a-result rule.

[5.3.0] — 2026-07-26
Added
Added eight Forge Cards in a warm-figure register the first twenty had no room for: Komorebi, Negative Fill, Waterline, Salt and Gold, Poolside Noon, Rim Light Confession, Light Through Water, and Lido 1972. Every one specifies a Figure pose and a Color Logic relationship, the two axes that most distinguish this board, and several deliberately leave axes open.
Added FIGURE, a seventeenth axis of 80 signals describing how the body is arranged rather than what it is doing: contrapposto, counter-rotated shoulders and hips, weight on one hip, chin down with the eyes up, hand at the nape. Action carried 160 verbs and not one of them described posture, so the entire language of figure drawing and portrait direction was unreachable from the board.
Added 16 swimwear and poolside garments to Wardrobe, taking it from 144 to 160. The axis could dress a figure for a cleanroom, a beehive, and an antique diving bell, but held exactly one swim-adjacent entry.
Added Figure to the Story reroll scope, which now moves narrative, action, figure, and wardrobe together — what the subject is doing, how the body holds it, and what it wears.
Added `llms.txt`, a plain-text front door for machine readers: what Prompt Forge is, the seventeen axes, where the vocabulary lives, and the operating instruction. Figure and Color Logic are called out by name, since both are unusual and an agent that skips them leaves most of the instrument unused.
Added `vocabulary.json` and `vocabulary.txt`, the complete 2,128-signal vocabulary published as data so nothing has to scrape the application. Both are generated from `index.html` by `npm run vocabulary`.
Added a `<link rel="alternate">` and an `ai-vocabulary` meta tag to the first few hundred bytes of the `<head>`, so a truncated fetch still lands on a pointer to the vocabulary. `index.html` is ~175 kB and the signal pools begin about 34 kB in, past where many fetchers stop.
Added `social-card.png` and the Open Graph and Twitter card metadata that points at it, so shared links render a picture of the board instead of bare text. Regenerated with headless Chrome; the audit checks the file exists, that `og:image` is absolute, and that `twitter:card` is set.
Added raw.githubusercontent.com mirrors for `llms.txt`, `vocabulary.json` and `vocabulary.txt`, plus an ACCESS section stating that nothing here is gated. Some agents run fetchers that allowlist hosts and cannot reach `*.github.io`, which blocks the instructions along with the data. Every entry point now carries the mirror address, and the audit enforces it.
Added `.nojekyll` so GitHub Pages serves the repository verbatim rather than running it through a static-site build.
The `FULL` payload button now derives its axis count instead of restating it, the same fix applied to the footer.
Added audit checks that the published vocabulary files match the live `categories` object, that `llms.txt` references both, and that the `<head>` pointer is present.
Fixed
Fixed the footer, which reported the wrong version twice. The static markup said DARPA v4.0 and the v5 layer overwrote it with a hardcoded v5.1, while `PF_VERSION` sat at 5.2 in the same file. The runtime footer now interpolates `PF_VERSION`.
Tightened `llms.txt` to require that a signal be listed *under the axis it is used in*. The previous wording asked only that values appear in the vocabulary, which permitted relocating a real signal into the wrong axis — observed in the wild, where an agent placed the lighting signal Twilight into weather and produced two lighting selections.
Strengthened the omission guidance after an agent filled all sixteen axes: filling every axis is now named as the signature of completing a form rather than making an image.
Added audit checks that every version string in `index.html` agrees with `package.json`, and that the runtime footer derives its version instead of restating it.
Corrected `<head>` metadata that was two versions stale: the page title and Open Graph title still said DARPA v4, and the description still claimed 2,000 signals. This is the region a truncating fetcher is most likely to read, so it was the worst place in the file to be wrong.
Narrowed the self-containment check to `rel="stylesheet"`. It previously rejected any local `<link href>`, which would have failed the new `rel="alternate"` vocabulary pointer — a data reference the page does not need in order to render.
Changed
Applied restraint to the twelve Forge Cards that set every axis available to them, removing 42 assignments. The cuts were tautologies (Projection Cathedral stated its idea in medium, lighting and wardrobe), weather on interiors (all twelve set it, including a courtroom, a data centre, a sealed bunker and a kitchen), and one outright contradiction (Field Artifact declared Object-Centered Stillness while specifying what a person was doing and wearing). The twelve now set 12–13 axes and leave 4–5 open, so a card hands you a coherent core and empty rows to roll.
Forge Card definitions are written in prompt order, so a card reads in the sequence it builds.
Validated
2,128 unique signals across 17 axes, no duplicates within any axis, every axis a multiple of 16.
28 Forge Cards in source, every value resolving to its correct axis, all metadata present.
Reroll scopes are disjoint and cover all seventeen axes.
Pinned and muted rows survive card application, randomize, cluster rerolls, and strumming.
The published vocabulary files match the application, and every entry point carries the mirror addresses.
[5.2.0] — 2026-07-24
Added
Added 32 mediums, taking the axis from 128 to 160 and the forge from 2,000 to 2,032 signals.
Added an image-in-motion bank of 20: Claymation, Stop Motion, Puppet Animation, Cutout Animation, Silhouette Animation, Pixilation, Sand Animation, Paint-on-Glass Animation, Pinscreen Animation, Cel Animation, Rotoscoping, Rubber Hose Animation, Machinima, Motion Capture Animation, Zoetrope Strip, Flip Book Sequence, Chronophotography, Slit-Scan Photography, Stroboscopic Exposure, and Time-Lapse Composite. The forge could previously name 128 ways to make a still image and no way to make an image that moves.
Added 12 historical processes the v4 expansion reached past: Mezzotint, Aquatint, Drypoint, Silverpoint, Autochrome, Albumen Print, Gum Bichromate Print, Platinum Palladium Print, Camera Obscura Study, Reverse Glass Painting, Sgraffito Plaster, and Pietra Dura Inlay.
Added the Signal Rig: a sixteen-chip strip that sets which axes are in play before forging.
Added three named signal states — live, pinned, and muted — read from the lock and value the forge already stored.
Added a per-row mute control that blanks an axis and holds it blank in a single tap, replacing the undiscoverable clear-then-lock sequence.
Added MUTE BLANKS, PIN FILLED, and ALL LIVE for setting the whole rig at once.
Added a live rig readout counting live, pinned, and muted axes.
Added cluster hover preview: hovering a reroll scope outlines the exact rows and chips it will change before the click commits.
Added generated cluster button titles listing member axes, so a scope's label can no longer drift from its membership.
Changed
Reroll scopes now partition the sixteen axes instead of overlapping. Structure and Story previously shared three of their four rows, which is why the four buttons felt interchangeable.
Structure is now Composition, Camera, and Setting; Story is now Story Signal, Action, and Wardrobe; Surface absorbs Color Logic, which belonged to no scope at all and was unreachable from any cluster button.
Cluster buttons are prefixed with ⟳ so the label reads as the action it performs.
The lock glyph now distinguishes pinned (🔐) from muted (🚫); a muted row is styled slate rather than gold.
Locking a row that holds no value now presents as muting it. The underlying state is unchanged.
`toggleLock` and `unlockAll` route through one state setter instead of poking DOM nodes directly, and no longer throw when a row is absent.
Fixed
Fixed the audit harness, which had silently verified nothing since v5 shipped. Its script-extraction pattern anchored on `</script></body>` and began matching at the first inline block, so adding the `v5.js` tag made it swallow markup as JavaScript and fail to parse the application at all.
Folded `v5.js` back into `index.html` as a second inline script block. The project described itself as single-file for two releases while shipping two files; it is now one file again, and the audit fails if a local script or stylesheet reference is reintroduced.
Removed `dist/` and the build step. With `index.html` self-contained there is nothing left to mirror, which retires the drift that produced the stale distribution in the first place.
Validated
2,032 unique signals across 16 axes, with no duplicates within any axis and every axis a multiple of 16.
Reroll scopes are disjoint and cover all sixteen axes.
The three rig states derive correctly from lock and value for every axis.
Every inline script block parses, and `index.html` references no local script file.
The merged file opens and runs correctly straight from disk over `file://` with no server. Tailwind and the two webfonts are still fetched from public CDNs, so an offline copy runs fully but renders with fallback styling.
Muted axes survive randomize, Forge Cards, cluster rerolls, strumming, Mutate 3, and Option Radar, and persist across reload and Blueprint round-trips.
[5.1.0] — 2026-07-24
Added
Added repeated drag-strumming across the sixteen category rows.
Added Shift-drag step strumming for sequential movement through category pools.
Added persistent custom signals for every category.
Added custom-signal participation in randomization, strumming, Option Radar, and Blueprint saves.
Added Clear Unlocked while preserving locked values and intentionally locked blanks.
Added the DARPA Forge Card and its phosphor-terminal, CRT-raster, telemetry, wireframe, and defense-interface vocabulary.
Changed
Centralized random selection behind a browser-crypto-backed random helper.
Random rerolls now avoid selecting the current value when alternatives exist.
Strumming can retrigger repeatedly during one held pointer gesture, including when returning to a previously crossed row.
The DARPA card now leaves scene-dependent axes blank so subjects remain the image rather than appearing on an operator's monitor.
Prompt Forge is now a user-extensible instrument rather than a fixed signal bank.
Moved the v5 behavior layer into `v5.js` while retaining the original static application foundation.
Persistence
Custom category pools are stored in browser local storage.
Newly saved Blueprints preserve custom pools alongside selections, locks, negatives, output format, and flight controls.
[5.0.0] — 2026-07-24
Added
Introduced the Strum interaction model.
Added per-category custom pool management.
Added the first DARPA aesthetic card.
Added Clear Unlocked.
Upgraded the application identity from DARPA v4 to DARPA v5.
[4.0.0] — 2026-07-20
Added
Expanded the forge from 1,343 to exactly 2,000 unique signals.
Added Composition, Color Logic, and Story Signal axes for a total of 16.
Added 12 curated Forge Cards, bringing the collection to 20.
Added RECON, STANDARD, and FULL mission doctrines.
Added Mutate 3 and Structure, Atmosphere, Surface, and Story cluster rerolls.
Added cross-category Option Radar search.
Added Midjourney version, stylize, weird, resolution, seed, style-reference, style-weight, profile, RAW, TILE, and DRAFT controls.
Added live prompt telemetry and compatibility diagnostics.
Added persistent 24-prompt history and named Blueprint Vault configurations.
Changed
Locks now prevent every mutation route, including preset, radar, clear, and direct randomization operations.
Prompt axes now emit in a deliberate narrative-to-finish order.
Forge Cards clear stale unlocked values before applying their own doctrine.
Expanded aspect-ratio controls with 2:3 and 4:3.
Increased the visual hierarchy and information density of preset cards and category rows.
Validated
2,000 signals with no duplicates.
Every Forge Card value resolves to a real option.
All category clusters and prompt-order references resolve.
RECON selects 6 axes, STANDARD selects 10, and FULL selects 16.
Model-incompatible parameters are suppressed or diagnosed.
Runtime, persistence, locking, blueprint, and prompt-building suites pass with zero faults.
[3.0.0]
Original public Prompt Forge foundation.
Thirteen visual categories, 1,343 options, eight presets, chaos controls, negative prompts, and multi-model output formatting.
