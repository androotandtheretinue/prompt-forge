# Prompt Forge 5.4.0 — Field Reports

Almost nothing in this release was found by looking harder at the code.

Cold agents were pointed at the board and failed in the wild, each in a different way, and every failure came back as a fix. An outside audit of the published vocabulary found the holes were clustered rather than scattered. A Claude instance fetched the page and reported that the thing meant for it had been stripped in transit. The repo mostly said it was fine. The people and machines using it said otherwise.

## The chaos dial has teeth

The dial appended an adjective and called it chaos — a promise the prompt could not cash, since nothing about the output looked wilder at 90 than at 10. It still appends the adjective. It now also damages the signal text itself, which is chaos you can read before you ever generate.

Two different things are happening, and the ladder separates them. **Semantic drift** bends meaning while leaving the token intact: *Golden Hour* becomes *Borrowed Golden Hour*, which a model understands perfectly and answers differently. **Orthographic corruption** attacks the token, and a misspelling lands off-manifold in the embedding space where the response is genuinely unpredictable. Drift steers. Corruption destabilises.

The meter documents itself. Each tick names the worst thing that can happen past it:

| Tick | Tier | Example |
| --- | --- | --- |
| 0 | clean — pure passthrough | `Golden Hour` |
| 25 | **DRIFT** | `Half-Remembered Serene` |
| 50 | **MISSPELL** | `Goledn Hour` |
| 75 | **LEET** | `H4R8Or 4t L0w T1d3` |
| 100 | **ZALGO** | `L͙år̈́ǵê F̀̊o̧r͓m͙á̧t͓` |

The zones are **cumulative, not exclusive**. At the top you get a mix of clean, drifted, misspelled, leeted and eaten signals rather than uniform damage — uniform corruption reads as a filter and breaks every wild prompt identically. A weighted draw per signal is what makes it texture instead.

Four properties make it an instrument rather than a hazard:

- **Locked signals are immune.** A pin already survives cards, radar, clearing, mutation, strumming and randomize, so it survives this. Pin the subject and the medium, then let chaos gnaw the periphery. A dial that can eat your anchor is not something you can aim.
- **Corruption is seeded**, and the seed saves with Blueprints. Chaos you cannot repeat is neither shareable nor testable; *blueprint plus seed 47* is a result someone else can actually obtain. Blueprints written before this feature carry no seed and fall back to the default, so old saves reproduce exactly what they always did.
- **The wound is shown.** Every corrupted signal is listed with its original struck through beside what became of it, coloured by tier. A tool that quietly rewrites your choices is not one to trust, and at high settings the damage is the product.
- **Only the last tick warns.** Combining marks are the one tier that can defeat a parameter parser or be stripped in silence, so diagnostics stay quiet across ninety percent of the dial's travel and mean something when they fire.

`llms.txt` now says the same thing louder, because most models will silently repair a misspelling on the way past — which discards the choice and returns an image nobody asked for.

## llms.txt is a protocol, not a catalogue

The file addressed one audience and served two. A human opens Prompt Forge to meet visual language they would not have thought of; that is what the curated signals are for. A language model arrives already carrying broad visual vocabulary. What it lacked was the **structure**.

The file is now split, protocol first:

- **PROTOCOL** — the seventeen axes with a one-line gloss each, the selection and omission rules, the output contract, and what to do about images. Complete in that one file.
- **LEXICON** — the curated vocabulary, named as optional.

The protocol stays inline rather than moving to a dedicated file, because a second file would sit behind exactly the two failures already seen in the wild: a truncated fetch and an allowlisted host.

Each axis carries a gloss, which is the load-bearing addition. An agent filling from its own knowledge cannot act on `colorlogic` or `figure` as bare keys; it needs to know that colorlogic is a relation between regions rather than a colour, and that figure is how the body is arranged rather than what it does.

**Three modes are valid** — `canonical` (every value from the Lexicon), `protocol` (own knowledge), `mixed` — and naming the mode is required. A model-supplied value is a good prompt *and* a false citation; the label is the only thing keeping those apart.

The protocol is also **embedded verbatim in the application page**, in a collapsed disclosure beneath the header. One fetch of the URL people actually share is now enough.

## What eight cold agents taught the file

Every rule below exists because a specific agent did a specific thing. None was predictable from inside the repo.

| Observed | Now |
| --- | --- |
| Put `Twilight` — a lighting signal — in weather | A value belongs to exactly one axis, with that example named |
| Filled all sixteen axes | Filling everything is named as form-completion, not making |
| Could not reach `*.github.io`, stopped correctly | Mirrors on every entry point, including `llms.txt` itself |
| Returned an idea and an image, no axes; asserted compliance when challenged | A reply without the axis lines is not a result, whatever was chosen internally |
| Wrote the character into `figure` | Subject is its own field, and comes first |
| Returned four parts of five, missing the prompt | Part 4 is named as the one that must never be absent |
| Accounted for sixteen of seventeen axes, `palette` gone | Count before you send |
| Announced readiness and waited for an idea | The idea and subject are yours to choose; the first reply is the work |

The eighth is the one with the widest blast radius: a fully compliant agent asked for *"one more"* returned an image alone. It did not refuse the protocol — it stopped treating the exchange as one. A follow-up reads as conversation, and conversation is where a fetched instruction goes quiet.

## The clustered gaps

An outside audit found the vocabulary's holes were grouped, which is the finding worth having. A missing signal is an inconvenience. A missing **territory** is a genre the board cannot enter, and there were four.

- **The Western** had no on-ramp anywhere. Setting jumped from Victorian Era to Roaring Twenties with no frontier town or saloon; wardrobe held a kimono and a kilt and no duster; style had every conceivable -punk and no Western.
- **Performance** had actions with no world. *Performing on Stage* and *Conducting an Orchestra* existed while theatre, footlights and dancewear did not.
- **Celebration** could be infiltrated but not thrown — *The Ceremony Has Been Infiltrated*, with no ballroom and no fireworks.
- **Nothing rode anything.** 160 actions, no riding, driving, rowing, sailing or surfing — which survived a release that added sixteen swimsuits.

**176 signals across eleven axes**, sixteen each, since the grid is audited. The forge goes from 2,128 to **2,304**.

Setting also gains the plain versions of places it only held estranged: *Hospital Ward* beside *Hospital Without Staff*, *Courtroom* beside *Courtroom for Nonhuman Persons*. The board tilts the ordinary on purpose, but tilting is a choice the user should get to make, and it cannot be made from a bank that only stocks the tilted one.

Two absences were children shipped without parents: **Afrofuturism** (Afro-Surrealism and Queer Futurism had shipped without it) and **Mannerism** (Neo-Mannerism without its parent).

## Scopes gained pin and mute

A cluster scope could only reroll. If you wanted an image carrying no story at all, you muted four rows by hand and hoped you had not missed one.

Each scope now carries the same three verbs a single row does — **⟳ reroll, 🔐 pin, 🚫 mute**. Mute Story and narrative, action, figure and wardrobe stay blank through everything. Both operators toggle back to live, so a scope cannot be stranded held.

## The versions nobody could see

The static page header said **DARPA v4.0 · 2000 Options** for three releases. JavaScript rewrites it on load, so in a browser it was always right and nobody reads what they cannot see. Then the protocol embed made markdown extraction a first-class way to read this page — and stripping the script leaves that stale line as the only version a large class of agent ever sees. An outside audit of the live page reported the version as v4.0.0 for exactly this reason.

Three meta descriptions in the first kilobyte were two releases behind as well. Both are checked now, including a sweep for any signal count stated anywhere in the markup rather than a check per tag, so the next one added is covered without being named.

## Verified

2,304 unique signals across 17 axes and 28 Forge Cards in the canonical banks, no duplicates within any axis, no collisions between the 176 new terms and the rest, every axis a multiple of sixteen, every preset and prompt-order reference resolving. The running app carries more — `installDarpaCard()` appends its vocabulary on load, so the live board reports **2,343 signals and 29 Forge Cards**. Both counts are right; the audit measures the source.

Eleven corruption invariants are checked and four negative-tested: the passthrough below the first tick, each tier appearing at its own, zalgo confined to the last, cumulativeness at the top, determinism, that the seed reaches the engine, locked immunity, and that the ticks drawn on the meter match the steps the engine takes. A meter that documents itself has to be right, or it is worse than no legend.

The audit has grown into a claims-verifier as much as a correctness test. Most of what it checks now is prose asserting a fact about code — the version in five places, the counts in eight, the protocol's own file-size arguments, and every axis the app defines appearing in the machine-facing document.

## Why CC0

Unchanged. Take it, change it, give the changed thing away again — or do not. The gift has no hook in it.
