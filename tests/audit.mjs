import fs from 'node:fs';
import vm from 'node:vm';
import { extractVocabulary, toJson, toText, MIRRORS, extractProtocol } from '../tools/vocabulary.mjs';

const SOURCE_PATH = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(SOURCE_PATH, 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

/*
 * index.html carries more than one attribute-free <script> block: the
 * application, then the v5 interaction layer that reassigns parts of it.
 * Select by content rather than position. An earlier version of this harness
 * anchored on `</script>\s*</body>` and matched from the first block to the
 * last, so it swallowed markup as JavaScript and silently verified nothing for
 * two releases. Position is exactly the thing that keeps changing here.
 */
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
if (!blocks.length) {
  fail('No inline script blocks found.');
  process.exit();
}

// Every inline block must at least parse, whichever one we go on to execute.
blocks.forEach((block, index) => {
  try {
    new vm.Script(block);
  } catch (error) {
    fail(`Inline script block ${index + 1} of ${blocks.length} is invalid: ${error.message}`);
  }
});
if (process.exitCode) process.exit();

const APP_MARKER = 'const categories = {';
const appBlocks = blocks.filter(block => block.includes(APP_MARKER));
if (appBlocks.length !== 1) {
  fail(`Expected exactly one inline block defining \`${APP_MARKER}\`; found ${appBlocks.length}.`);
  process.exit();
}

let script = appBlocks[0];
script += `
globalThis.__forgeAudit = {
  counts: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).length])),
  duplicates: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).filter((option, index, all) => all.indexOf(option) !== index)])),
  presetErrors: Object.entries(presets).flatMap(([name, preset]) => Object.entries(preset).filter(([key, value]) => !categories[key] || !categories[key].options.includes(value)).map(([key, value]) => ({ name, key, value }))),
  missingMeta: Object.keys(presets).filter(name => !presetMeta[name]),
  missingFromOrder: Object.keys(categories).filter(key => !promptOrder.includes(key)),
  extraInOrder: promptOrder.filter(key => !categories[key]),
  clusterErrors: Object.entries(categoryClusters).flatMap(([name, keys]) => keys.filter(key => !categories[key]).map(key => ({ name, key }))),
  clusterMembership: Object.entries(categoryClusters).flatMap(([name, keys]) => keys.map(key => ({ name, key }))),
  clusterNames: Object.keys(categoryClusters),
  categoryKeys: Object.keys(categories),
  cardCount: Object.keys(presets).length,
  corruption: (() => {
    const probe = 'Golden Hour';
    const kindsAt = level => Object.keys(categories).map(key => corruptSignal(key, probe, level, 47).kind);
    const sample = level => Object.keys(categories).map(key => corruptSignal(key, probe, level, 47).value).join('|');
    categories.medium.locked = true;
    const lockedResult = corruptSignal('medium', probe, 100, 47);
    categories.medium.locked = false;
    return {
      cleanBelowFirstTick: kindsAt(24).every(kind => kind === 'clean'),
      driftsAtFirstTick: kindsAt(40).some(kind => kind === 'drift'),
      spellsBySecondTick: kindsAt(60).some(kind => kind === 'spell'),
      leetsByThirdTick: kindsAt(85).some(kind => kind === 'leet'),
      zalgoAtLastTick: kindsAt(100).some(kind => kind === 'zalgo'),
      zalgoBelowLastTick: [25, 40, 55, 70, 85, 99].some(level => kindsAt(level).includes('zalgo')),
      cumulativeAtTop: new Set(kindsAt(100)).size > 1,
      deterministic: sample(85) === sample(85),
      seedMatters: sample(85) !== Object.keys(categories).map(key => corruptSignal(key, probe, 85, 999).value).join('|'),
      lockedImmune: lockedResult.kind === 'locked' && lockedResult.value === probe,
      zalgoThreshold: typeof ZALGO_AT === 'number' ? ZALGO_AT : null,
      tickCount: Array.isArray(CHAOS_TICKS) ? CHAOS_TICKS.length : 0
    };
  })(),
  rigStates: Object.keys(categories).map(key => {
    const cat = categories[key];
    const read = value => { cat.value = value.value; cat.locked = value.locked; return categoryStateOf(cat); };
    const before = { value: cat.value, locked: cat.locked };
    const observed = {
      live: read({ value: 'x', locked: false }),
      liveBlank: read({ value: '', locked: false }),
      pinned: read({ value: 'x', locked: true }),
      muted: read({ value: '', locked: true })
    };
    cat.value = before.value;
    cat.locked = before.locked;
    return { key, observed };
  })
};`;

const context = {
  console,
  document: { addEventListener() {} }
};
vm.createContext(context);

try {
  new vm.Script(script);
  vm.runInContext(script, context);
} catch (error) {
  fail(`Application JavaScript is invalid: ${error.stack}`);
  process.exit();
}

const audit = context.__forgeAudit;
const total = Object.values(audit.counts).reduce((sum, count) => sum + count, 0);
const duplicateCount = Object.values(audit.duplicates).reduce((sum, values) => sum + values.length, 0);

if (Object.keys(audit.counts).length !== 17) fail(`Expected 17 axes; found ${Object.keys(audit.counts).length}.`);
if (total !== 2304) fail(`Expected 2,304 signals; found ${total}.`);
if (duplicateCount) fail(`Found ${duplicateCount} duplicate signals.`);
if (audit.cardCount !== 28) fail(`Expected 28 Forge Cards; found ${audit.cardCount}.`);
if (audit.presetErrors.length) fail(`Broken Forge Card values: ${JSON.stringify(audit.presetErrors)}`);
if (audit.missingMeta.length) fail(`Forge Cards missing metadata: ${audit.missingMeta.join(', ')}`);
if (audit.missingFromOrder.length || audit.extraInOrder.length) fail('Prompt order does not match the category registry.');
if (audit.clusterErrors.length) fail(`Broken cluster references: ${JSON.stringify(audit.clusterErrors)}`);

/*
 * Every axis is sized to a multiple of sixteen. That has been true since the v4
 * expansion brought each legacy bank to a round target, but it was a convention
 * held by hand and nothing caught a drift. v5.2 took medium from 128 to 160 and
 * the rule is now checked.
 */
const offGrid = Object.entries(audit.counts).filter(([, count]) => count % 16 !== 0);
if (offGrid.length) fail(`Axes not sized to a multiple of 16: ${offGrid.map(([key, count]) => `${key} (${count})`).join(', ')}`);

/*
 * Reroll scopes must partition the axes. Overlapping scopes are what made the
 * four cluster buttons feel interchangeable before v5.2, and an uncovered axis
 * (colorlogic, until v5.2) is one no cluster button can ever reach.
 */
const clusteredKeys = audit.clusterMembership.map(entry => entry.key);
const duplicatedInClusters = clusteredKeys.filter((key, index) => clusteredKeys.indexOf(key) !== index);
const uncovered = audit.categoryKeys.filter(key => !clusteredKeys.includes(key));
if (duplicatedInClusters.length) fail(`Reroll scopes overlap on: ${[...new Set(duplicatedInClusters)].join(', ')}`);
if (uncovered.length) fail(`Axes reachable by no reroll scope: ${uncovered.join(', ')}`);

/*
 * The chaos dial corrupts signal text, and every property that makes it an
 * instrument rather than a hazard is checked here.
 *
 * The ladder must be cumulative — uniform corruption reads as a filter, and
 * every high-chaos prompt would break the same way. Zalgo must stay at the last
 * tick, because it is the only tier that can defeat a parameter parser and the
 * only one the diagnostics warn about; if it leaked downward the warning would
 * be wrong everywhere. Locked signals must survive, following the rule that
 * pins survive cards, radar, clearing, mutation and randomize. And the same
 * seed must produce the same damage, or a blueprint cannot reproduce a result
 * and nothing here can be tested twice.
 */
const chaos = audit.corruption;
if (!chaos.cleanBelowFirstTick) fail('Chaos corrupts below the first tick; the bottom quarter of the dial must be a passthrough.');
if (!chaos.driftsAtFirstTick) fail('Chaos produces no semantic drift past the first tick.');
if (!chaos.spellsBySecondTick) fail('Chaos produces no misspellings past the second tick.');
if (!chaos.leetsByThirdTick) fail('Chaos produces no leetspeak past the third tick.');
if (!chaos.zalgoAtLastTick) fail('The last tick produces no zalgo, so the final zone does nothing the third does not.');
if (chaos.zalgoBelowLastTick) fail('Zalgo appears below the last tick. Only the final zone may emit combining marks, since only it is warned about.');
if (!chaos.cumulativeAtTop) fail('Corruption at the top of the dial is uniform. The tiers must stay cumulative or every wild prompt breaks identically.');
if (!chaos.deterministic) fail('The same seed and dial setting produced different corruption; chaos must be reproducible to be shareable.');
if (!chaos.seedMatters) fail('Changing the chaos seed changed nothing, so the seed is not reaching the corruption.');
if (!chaos.lockedImmune) fail('Chaos corrupted a locked signal. Pins survive every other automated operation and must survive this one.');
if (chaos.zalgoThreshold !== 100) fail(`Zalgo threshold is ${chaos.zalgoThreshold}; the meter is drawn with its last tick at 100.`);
if (chaos.tickCount !== 4) fail(`Expected 4 chaos ticks; found ${chaos.tickCount}.`);

// Each tick drawn on the meter must match a tier the engine actually has.
const drawnTicks = [...html.matchAll(/class="chaos-tick[^"]*" data-at="(\d+)"/g)].map(match => Number(match[1]));
const engineTicks = [0, 25, 50, 75, 100];
if (drawnTicks.join(',') !== engineTicks.join(',')) {
  fail(`The meter draws ticks at ${drawnTicks.join(', ')}; the corruption ladder steps at ${engineTicks.join(', ')}. A meter that documents itself has to be right.`);
}

/*
 * The strum lane sits beside the board, not inside it.
 *
 * Giving categoriesPanel a flex parent silently changed what
 * `categoriesPanel.before(...)` means: the v5 layer's strum hint went from
 * above the board to beside it, as a third column, and the board shrank to
 * make room. Nothing errored. Anything else that inserts relative to the panel
 * will hit the same edge, so the arrangement is asserted here.
 */
const laneWrapper = html.match(/<div class="board-with-lane[^"]*">([\s\S]*?)<\/div>\s*<!-- Preview Panel -->/);
if (!/<div class="board-with-lane/.test(html)) {
  fail('The strum lane wrapper is gone; the lane and the board must share a flex row.');
} else {
  const region = html.slice(html.indexOf('board-with-lane'), html.indexOf('id="categoriesPanel"'));
  if (!region.includes('id="strumLane"')) {
    fail('The strum lane must come before the category board inside the wrapper, so height maps to axis in reading order.');
  }
  if (!/\.closest\('\.board-with-lane'\)/.test(html)) {
    fail('The strum hint is inserted with categoriesPanel.before without reaching for the wrapper, which puts it beside the board instead of above it.');
  }
}

/*
 * Mobile ordering: every section named in the markup must have a rule, and
 * every rule must name a section that exists.
 *
 * The phone layout reorders the page with flexbox so the board comes before
 * the panels that tune it — 2,231px of scrolling before the first axis, until
 * it did not. That mapping lives in two places, an attribute and a stylesheet,
 * and a section whose name matches nothing silently keeps the fallback order
 * while looking deliberate. Neither half is visible from the other.
 */
const orderedSections = [...html.matchAll(/data-mobile-order="([a-z]+)"/g)].map(match => match[1]);
const styledSections = [...html.matchAll(/\[data-mobile-order="([a-z]+)"\]\s*\{\s*order:/g)].map(match => match[1]);
const markupSections = orderedSections.filter(name => !styledSections.includes(name));
const orphanRules = styledSections.filter(name => !orderedSections.includes(name));
if (markupSections.length) {
  fail(`These sections carry data-mobile-order with no rule to place them: ${[...new Set(markupSections)].join(', ')}.`);
}
if (orphanRules.length) {
  fail(`These mobile order rules name sections that no longer exist: ${[...new Set(orphanRules)].join(', ')}.`);
}
if (!/\.max-w-4xl > \*\s*\{\s*order:/.test(html)) {
  fail('The mobile order has no default for unlabelled sections, so a new panel would sort above the board rather than below it.');
}

/*
 * The mobile strum runs sideways, and must not fight the scroll it shares a
 * surface with. `touch-action: pan-y` is the whole mechanism: it hands vertical
 * swipes to the page and keeps only horizontal ones. Without it the strip
 * captures both and the page stops scrolling under the thumb.
 */
if (!/\.strum-strip\b[\s\S]{0,600}?touch-action:\s*pan-y/.test(html)) {
  fail('The mobile strum strip does not set touch-action: pan-y, so a vertical swipe on it would fight the page scroll.');
}

// The Signal Rig reads three states out of the two persisted properties.
const badStates = audit.rigStates.filter(({ observed }) =>
  observed.live !== 'live' ||
  observed.liveBlank !== 'live' ||
  observed.pinned !== 'pinned' ||
  observed.muted !== 'muted');
if (badStates.length) fail(`Rig state derivation is wrong for: ${badStates.map(entry => entry.key).join(', ')}`);

/*
 * Prompt Forge is one file. Nothing may reintroduce a local *render*
 * dependency — something the page must fetch before it works.
 *
 * Stylesheets count, scripts count. `rel="alternate"` does not: it points at
 * vocabulary.json for machine readers, and the page renders and runs whether or
 * not that file is reachable. Scoping this to rel="stylesheet" rather than every
 * <link> is the difference between a check that describes self-containment and
 * one that merely forbids local hrefs.
 */
const stylesheetRefs = [...html.matchAll(/<link\s([^>]*)>/g)]
  .map(match => match[1])
  .filter(attrs => /rel=["'][^"']*\bstylesheet\b/.test(attrs))
  .map(attrs => (attrs.match(/href=["']([^"']+)["']/) || [])[1])
  .filter(Boolean)
  .map(ref => ({ tag: 'stylesheet', ref }));

const localRefs = [
  ...[...html.matchAll(/<script\s[^>]*src=["']([^"']+)["']/g)].map(match => ({ tag: 'script', ref: match[1] })),
  ...stylesheetRefs
].filter(({ ref }) => !/^(https?:)?\/\//.test(ref) && !/^(data|#)/.test(ref));
if (localRefs.length) fail(`index.html is not self-contained; it loads ${localRefs.map(entry => `${entry.ref} (${entry.tag})`).join(', ')}.`);

/*
 * The published vocabulary files must match the application exactly.
 *
 * vocabulary.json and vocabulary.txt exist so machine readers do not have to
 * scrape a 175 kB single-file app whose signal pools start past most fetch
 * truncation limits. That only helps if they are true. A stale vocabulary file
 * is worse than no vocabulary file: it is authoritative-looking, publicly
 * cached, and wrong in a way nobody notices until a prompt references a signal
 * the forge does not have.
 *
 * Regenerate with `npm run vocabulary` after changing any pool.
 */
const version = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const published = [
  { file: 'vocabulary.json', expected: () => toJson(extractVocabulary(html), version) },
  { file: 'vocabulary.txt', expected: () => toText(extractVocabulary(html), version) }
];

// Compare content, not line endings. git's autocrlf rewrites these files on
// checkout under its default Windows configuration, which would otherwise fail
// this check on a clean clone and make the suite look broken to a new
// contributor before they had changed anything.
const normalize = text => text.replace(/\r\n/g, '\n');

for (const { file, expected } of published) {
  const path = new URL(`../${file}`, import.meta.url);
  if (!fs.existsSync(path)) {
    fail(`${file} is missing. Run \`npm run vocabulary\`.`);
    continue;
  }
  if (normalize(fs.readFileSync(path, 'utf8')) !== normalize(expected())) {
    fail(`${file} does not match index.html. Run \`npm run vocabulary\`.`);
  }
}

// The front door has to point at files that exist, or it is worse than absent.
const llms = fs.readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');

/*
 * llms.txt is hard-wrapped, so any required sentence longer than a line is
 * split by a newline and a prose check written as one string silently stops
 * matching. That is a check that fails when the file is reflowed rather than
 * when the rule is removed — worse than no check, since it trains you to
 * ignore it. Structural checks below still read `llms`; prose checks read this.
 */
const llmsFlat = llms.replace(/\s+/g, ' ');
for (const ref of ['vocabulary.json', 'vocabulary.txt']) {
  if (!llms.includes(ref)) fail(`llms.txt does not reference ${ref}.`);
}

/*
 * Mirrors must be reachable from every entry point.
 *
 * An agent whose fetcher allowlists hosts can be blocked from *.github.io, and
 * that blocks llms.txt along with everything else — the reader fails before
 * reaching the sentence that would have told them where else to look. One
 * observed in the wild stopped rather than fabricating, which is the file
 * working, but it should not have had to stop at all.
 *
 * So every door carries the address of the others: llms.txt, both generated
 * vocabulary files, and the <head> meta that survives truncation.
 */
if (!/^#+ ACCESS$/m.test(llms)) {
  fail('llms.txt has no ACCESS section telling a blocked reader that nothing is gated.');
}

/*
 * llms.txt is two documents in one file: a PROTOCOL that is complete on its
 * own, and a LEXICON that is optional. That split is the whole design — an
 * agent that can read only this file must still be able to operate the board,
 * because the two failures seen in the wild were a truncated fetch and a
 * blocked host. Putting the protocol in a second file would reintroduce both.
 */
for (const heading of ['## PROTOCOL', '## LEXICON']) {
  if (!llms.includes(heading)) {
    fail(`llms.txt is missing its ${heading.replace('## ', '')} section; the protocol/lexicon split is what makes the file self-sufficient.`);
  }
}

/*
 * Every axis must be named in llms.txt, with a gloss.
 *
 * The protocol is only portable if an agent can fill an axis from its own
 * knowledge, and it cannot do that for `colorlogic` or `figure` from the key
 * alone. Adding an axis to the app without describing it here would leave the
 * machine-facing contract quietly one axis short — exactly the drift this
 * suite exists to catch.
 */
const undescribed = audit.categoryKeys.filter(key => !new RegExp(`^${key}\\s{2,}\\S`, 'm').test(llms));
if (undescribed.length) {
  fail(`llms.txt does not describe these axes: ${undescribed.join(', ')}. Each needs a line of the form "<key>  <what it means>".`);
}

// The prompt is the deliverable; rendering is optional and additional.
if (!/never instead of/i.test(llmsFlat) || !/Always return/i.test(llmsFlat)) {
  fail('llms.txt no longer states that the prompt is always returned and that image generation is additional.');
}

/*
 * The anti-bluff mechanism.
 *
 * An agent asked to use the board replied with an idea and an image, no axis
 * lines, and then answered a challenge by asserting it had selected from the
 * categories. That claim was unfalsifiable, which is the actual defect: a
 * protocol nobody can check is a protocol nobody follows. Two things fix it —
 * saying that an unshown selection does not count, and showing the exact shape
 * of a compliant reply, since models copy a worked example far more reliably
 * than they follow a rule.
 */
if (!/not a Prompt Forge result/i.test(llmsFlat)) {
  fail('llms.txt no longer states that a reply without the axis lines does not count.');
}
if (!/^### Example of a compliant reply$/m.test(llms) || !/^Mode: /m.test(llms) || !/^Subject: /m.test(llms)) {
  fail('llms.txt is missing the worked example, or the example no longer shows a subject line.');
}

/*
 * Every axis considered, every blank reported.
 *
 * An agent filled five axes and said nothing about the other twelve. Nothing
 * in that reply distinguished twelve deliberate omissions from a pass that
 * stopped after five, and in the output those are identical. Naming the blanks
 * is the only evidence restraint happened — which is why it is required, and
 * why the reasons are not.
 */
if (!/all seventeen axes in order/i.test(llmsFlat)) {
  fail('llms.txt no longer tells the reader to consider every axis in turn.');
}

/*
 * The contract has to survive the second turn.
 *
 * An agent that had just produced a fully compliant reply was asked for "one
 * more" and returned prose and an image with no axes at all. It did not refuse
 * the protocol; it stopped treating the exchange as one. A follow-up reads as
 * conversation, and conversation is where a fetched instruction goes quiet, so
 * the file has to say that a variation is a new prompt.
 */
if (!/including follow-ups/i.test(llmsFlat) || !/second request is a second prompt/i.test(llmsFlat)) {
  fail('llms.txt no longer states that follow-ups and variations get the full output again.');
}
if (!/^Blank: /m.test(llms) || !/comes to seventeen/i.test(llmsFlat)) {
  fail('llms.txt no longer requires every blank axis to be reported by name.');
}

/*
 * Two things an agent got wrong even while following the contract.
 *
 * It produced a Blank list and dropped one axis from it — sixteen accounted
 * for out of seventeen, palette simply gone. Stating the total is not the same
 * as asking for the total to be checked, so the file now says to count.
 *
 * It also returned the idea, subject, axes and mode, and no assembled prompt.
 * Four parts of five, missing the only one that is the deliverable rather than
 * a description of it. That needed saying outright.
 */
if (!/Count before you send/i.test(llmsFlat)) {
  fail('llms.txt no longer asks the reader to check that filled plus blank equals seventeen.');
}

/*
 * The agent supplies the idea unless given one.
 *
 * "State the single idea the image serves" was read as "the human states it
 * and I restate it": an agent reported the protocol internalised, then asked
 * for an idea and waited. Nothing had gone wrong except deference — a request
 * to use the tool had been turned into a request for requirements. The file
 * now says the idea and subject are the agent's to choose by default, and that
 * announcing readiness is not a reply.
 */
if (!/Choose the idea and the subject yourself/i.test(llmsFlat) || !/the first reply is the work/i.test(llmsFlat)) {
  fail('llms.txt no longer states that the agent picks the idea and subject itself rather than asking for them.');
}

/*
 * Corruption has to be announced to downstream readers.
 *
 * The dial deliberately emits malformed tokens, and most models will silently
 * repair a misspelling on the way past — which discards the choice and returns
 * an image nobody asked for. The damage is load-bearing, so the file has to say
 * so where an agent handling the prompt will see it.
 */
if (!/Corrupted signals are deliberate/i.test(llmsFlat) || !/Do not correct it/i.test(llmsFlat)) {
  fail('llms.txt no longer warns that corrupted signals are deliberate and must not be repaired downstream.');
}
if (!/must never be absent/i.test(llmsFlat)) {
  fail('llms.txt no longer singles out the assembled prompt as the part that cannot be omitted.');
}

/*
 * The worked example must itself account for every axis, since it is the shape
 * agents copy. An eighteenth axis that never reached the example would teach a
 * seventeen-axis habit, and the rule above would be contradicted by the only
 * demonstration of it in the file.
 */
const example = llms.split('### Example of a compliant reply')[1] || '';
const exFilled = [...(example.split('Prompt:')[0] || '').matchAll(/^([a-z]+)\s{2,}/gm)].map(match => match[1]);
const exBlank = ((example.match(/^Blank: ([^\n]+)/m) || [])[1] || '')
  .replace(/\.$/, '').split(',').map(entry => entry.trim()).filter(Boolean);
const accounted = new Set([...exFilled, ...exBlank]);
const unaccounted = audit.categoryKeys.filter(key => !accounted.has(key));
const bogus = [...accounted].filter(key => !audit.categoryKeys.includes(key));
const bothWays = exFilled.filter(key => exBlank.includes(key));
if (unaccounted.length) fail(`The llms.txt example neither fills nor blanks: ${unaccounted.join(', ')}. It must account for every axis.`);
if (bogus.length) fail(`The llms.txt example names axes that do not exist: ${bogus.join(', ')}.`);
if (bothWays.length) fail(`The llms.txt example lists these as both filled and blank: ${bothWays.join(', ')}.`);

/*
 * The subject is not an axis.
 *
 * index.html keeps it in its own field and puts it at the head of the prompt,
 * ahead of the seventeen axis values. llms.txt described the axes and never
 * mentioned it, so an agent with a character to place had nowhere to put it —
 * one wrote the character into `figure`, which is for how a body is arranged,
 * not for whose body it is. A protocol that omits a field the app has will be
 * filled in by guesswork at the nearest-looking axis.
 */
if (!/^### Subject, then axes$/m.test(llms) || !/Never put the subject in an axis/i.test(llmsFlat)) {
  fail('llms.txt does not establish that the subject is separate from the axes and comes first.');
}
for (const [name, url] of Object.entries(MIRRORS)) {
  if (!llms.includes(url)) fail(`llms.txt does not list the ${name} mirror (${url}).`);
}
if (!html.includes('raw.githubusercontent.com/androotandtheretinue/prompt-forge')) {
  fail('The <head> ai-vocabulary pointer does not mention the mirror, so a truncated fetch on a blocked host finds no alternative.');
}

/*
 * The protocol embedded in index.html must match llms.txt exactly.
 *
 * index.html is the URL people share, so it is the one an agent fetches, and
 * it now carries the protocol rather than a pointer to it. A copy is a thing
 * that drifts — this project deleted dist/ over exactly that — so the copy is
 * generated and compared rather than maintained. Edit llms.txt and run
 * `npm run vocabulary`; never edit the embedded region.
 *
 * It also has to stay early. The whole point is surviving a truncated fetch,
 * and a protocol forty kilobytes into the file would be behind the same wall
 * the vocabulary already sits behind.
 */
/*
 * Script tags must balance, including inside comments.
 *
 * A comment here once explained the embed by spelling out a literal opening
 * script tag. Balanced parsers ignore comments and were fine; the regex-based
 * strippers used by extraction pipelines are not, and matched from that text
 * to the next closing tag — taking the protocol with it. The prose broke the
 * thing it described, and nothing rendered differently, so only a count catches
 * it.
 */
const scriptOpens = (html.match(/<script/gi) || []).length;
const scriptCloses = (html.match(/<\/script>/gi) || []).length;
if (scriptOpens !== scriptCloses) {
  fail(`index.html has ${scriptOpens} opening and ${scriptCloses} closing script tags. A stray one — even inside a comment — makes regex-based extractors swallow everything up to the next close.`);
}

const embedded = extractProtocol(html);
if (embedded === null) {
  fail('index.html has no llms.txt embed markers, so a reader of the page alone gets a pointer instead of the protocol.');
} else if (normalize(embedded) !== normalize(llms.trim())) {
  fail('The llms.txt copy embedded in index.html does not match llms.txt. Run `npm run vocabulary`.');
} else {
  /*
   * It also has to stay early — but a byte threshold was measuring the wrong
   * thing, and had to be raised twice by changes that were not regressions.
   * Inline CSS sits above the disclosure and grows whenever the interface does,
   * which the single-file rule guarantees; a ceiling tuned close to that number
   * fails on ordinary work and teaches you to raise it.
   *
   * What actually matters is order. The protocol must come before the board, so
   * a reader that gives up partway through has the instructions rather than the
   * markup for a control panel — and a markdown converter, which strips the
   * head entirely, lands on it within the first page of extracted text however
   * many kilobytes of style preceded it. The byte ceiling stays as a loose
   * backstop against something genuinely absurd.
   */
  const protocolAt = html.indexOf('BEGIN llms.txt');
  const boardAt = html.indexOf('id="categoriesPanel"');
  if (boardAt !== -1 && protocolAt > boardAt) {
    fail('The embedded protocol appears after the category board. It must come first, so a truncated read gets the instructions rather than a control panel.');
  }
  const offsetKb = Buffer.byteLength(html.slice(0, protocolAt), 'utf8') / 1024;
  if (offsetKb > 48) {
    fail(`The embedded protocol starts ${offsetKb.toFixed(0)} kB into index.html, which is further in than any amount of styling explains.`);
  }
}

/*
 * llms.txt argues from two numbers — how large index.html is and how far into
 * it the pools start — and those numbers are the reason it tells readers not to
 * scrape the page. They were wrong on first write (carried over from before the
 * v5.2 expansion) and they grow every time a signal is added. Checked with a
 * tolerance, so ordinary growth passes and genuine staleness does not.
 */
const htmlKb = Buffer.byteLength(html, 'utf8') / 1024;
const poolKb = Buffer.byteLength(html.slice(0, html.indexOf(APP_MARKER)), 'utf8') / 1024;
const claims = [
  { label: 'total size', actual: htmlKb, claimed: (llms.match(/It is a (\d+) kB/) || [])[1] },
  { label: 'pool offset', actual: poolKb, claimed: (llms.match(/begin about (\d+) kB in/) || [])[1] }
];
for (const { label, actual, claimed } of claims) {
  if (claimed === undefined) {
    fail(`llms.txt no longer states the ${label} of index.html in the expected form.`);
  } else if (Math.abs(Number(claimed) - actual) > Math.max(8, actual * 0.1)) {
    fail(`llms.txt claims ${claimed} kB for ${label}; index.html measures ${actual.toFixed(0)} kB.`);
  }
}
if (!/<link\s[^>]*rel=["']alternate["'][^>]*href=["']vocabulary\.json["']/.test(html)) {
  fail('index.html <head> is missing the vocabulary.json pointer that survives truncated fetches.');
}

/*
 * Version strings must agree with package.json.
 *
 * Three of them had drifted independently: the static footer said v4.0, the v5
 * layer overwrote it with a hardcoded v5.1 while PF_VERSION sat at 5.2 two
 * thousand lines above, and the <head> still advertised v4 to every link
 * preview and scraper. Each was written once and never read again, which is the
 * whole failure mode — so they are read here.
 */
const shortVersion = version.replace(/\.\d+$/, '');
const versionClaims = [
  { label: 'PF_VERSION', found: (html.match(/const PF_VERSION = '([^']+)'/) || [])[1], want: shortVersion },
  { label: 'static footer', found: (html.match(/FORGED WITH hop\.e[^<]*?v([\d.]+)/) || [])[1], want: shortVersion },
  { label: 'static header', found: (html.match(/id="optionCountHeader">[^<]*·\s*v([\d.]+)/) || [])[1], want: shortVersion }
];
for (const { label, found, want } of versionClaims) {
  if (found === undefined) fail(`Could not find the ${label} version string in index.html.`);
  else if (found !== want) fail(`${label} says v${found}; package.json is ${version} (expected v${want}).`);
}

/*
 * No agency name on the masthead.
 *
 * The project is called Prompt Forge, and the subtitle — Distributed Axis
 * Randomization & Prompt Assembly — describes what it does. The initials of
 * that phrase spell a federal agency, which is the joke, and the joke works
 * because a reader notices it rather than because the page announces it.
 *
 * Spelling the agency out is what would turn an easter egg into an implied
 * affiliation, so the surfaces a stranger meets first are kept clear of it. The
 * DARPA Forge Card and two of its signal values still carry the word, and are
 * meant to: a card inside a tool reads as a citation, the way a film emulation
 * names a film stock. That is content. This is the masthead.
 */
const brandSurfaces = [
  ['<title>', (html.match(/<title>([^<]*)<\/title>/) || [])[1]],
  ['og:title', (html.match(/og:title["'] content=["']([^"']*)/) || [])[1]],
  ['twitter:title', (html.match(/twitter:title["'] content=["']([^"']*)/) || [])[1]],
  ['static header', (html.match(/id="optionCountHeader">([^<]*)/) || [])[1]],
  ['static footer', (html.match(/<p>(FORGED WITH[^<]*)/) || [])[1]]
];
const brandedWithAgency = brandSurfaces.filter(([, text]) => text && /darpa/i.test(text));
if (brandedWithAgency.length) {
  fail(`These brand surfaces name a federal agency: ${brandedWithAgency.map(([where]) => where).join(', ')}. The subtitle spells it; the masthead should not.`);
}
if (!/Distributed Axis Randomization/i.test(html)) {
  fail('index.html no longer carries the Distributed Axis Randomization & Prompt Assembly subtitle, which is the whole of the naming.');
}

/*
 * The static header's signal count, too.
 *
 * JavaScript rewrites this line on load, so in a browser it is always right and
 * nobody looks at the markup. Markdown converters strip the script, which makes
 * the stale markup the only version a large class of agent ever sees — an
 * outside audit read the live page and reported v4.0 with 2000 options, three
 * releases behind. What no human can see is exactly what needs a check.
 */
const headerCount = (html.match(/id="optionCountHeader">[^<]*·\s*([\d,]+)\s*Options/) || [])[1];
if (headerCount === undefined) {
  fail('The static header no longer states a signal count in the expected form.');
} else if (Number(headerCount.replace(/,/g, '')) !== total) {
  fail(`The static header claims ${headerCount} options; the source holds ${total.toLocaleString()}.`);
}

/*
 * Every signal count stated anywhere in the markup.
 *
 * The description, og:description and twitter:description each carry one, and
 * all three sat two releases behind while the header and footer were being
 * fixed by hand. They live in the first kilobyte, which is the part a
 * truncating fetcher is most likely to keep, so a stale number there is the one
 * most likely to be read. Sweep for the pattern rather than naming each tag,
 * since the next one added would otherwise go unchecked too.
 */
const statedCounts = [...html.matchAll(/([\d,]{4,})\s+signals/gi)]
  .map(match => match[1])
  .filter(value => Number(value.replace(/,/g, '')) !== total);
if (statedCounts.length) {
  fail(`index.html states ${[...new Set(statedCounts)].join(', ')} signals somewhere in its markup; the source holds ${total.toLocaleString()}.`);
}

// The runtime footer must derive its version rather than restate it.
if (/v\d+\.\d+ ·/.test(html.slice(html.indexOf('footer.textContent'), html.indexOf('footer.textContent') + 400))) {
  fail('The runtime footer hardcodes a version instead of interpolating PF_VERSION.');
}

/*
 * Social-card image. A link preview pointing at a 404 is worse than one with no
 * image: the platform renders a broken card rather than a plain one, and the
 * failure is invisible from inside the repository.
 *
 * Only existence and the absolute URL are checked. Whether the picture still
 * looks like the current board cannot be verified here — regenerate it when the
 * board changes.
 */
const cardMatch = html.match(/property=["']og:image["'] content=["']([^"']+)["']/);
if (!cardMatch) {
  fail('index.html declares no og:image, so shared links render without a preview.');
} else {
  const cardUrl = cardMatch[1];
  if (!/^https?:\/\//.test(cardUrl)) {
    fail(`og:image must be an absolute URL; found "${cardUrl}". Scrapers resolve it against their own host.`);
  }
  const cardFile = cardUrl.split('/').pop();
  if (!fs.existsSync(new URL(`../${cardFile}`, import.meta.url))) {
    fail(`og:image points at ${cardFile}, which is not in the repository.`);
  }
  if (!/name=["']twitter:card["'] content=["']summary_large_image["']/.test(html)) {
    fail('An og:image is declared without twitter:card=summary_large_image, so X renders a thumbnail instead of a large card.');
  }
}

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log(`  ${audit.clusterNames.length} reroll scopes partitioning all ${audit.categoryKeys.length} axes`);
  console.log(`  every axis sized to a multiple of 16 (medium ${audit.counts.medium})`);
  console.log(`  ${blocks.length} inline script blocks, all parsing, no local script or stylesheet dependencies`);
  console.log(`  vocabulary.json and vocabulary.txt match the application`);
  console.log(`  llms.txt carries the protocol, all ${audit.categoryKeys.length} axes, and the mirrors`);
}
