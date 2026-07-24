import fs from 'node:fs';
import vm from 'node:vm';
import { extractVocabulary, toJson, toText } from '../tools/vocabulary.mjs';

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

if (Object.keys(audit.counts).length !== 16) fail(`Expected 16 axes; found ${Object.keys(audit.counts).length}.`);
if (total !== 2032) fail(`Expected 2,032 signals; found ${total}.`);
if (duplicateCount) fail(`Found ${duplicateCount} duplicate signals.`);
if (audit.cardCount !== 20) fail(`Expected 20 Forge Cards; found ${audit.cardCount}.`);
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
for (const ref of ['vocabulary.json', 'vocabulary.txt']) {
  if (!llms.includes(ref)) fail(`llms.txt does not reference ${ref}.`);
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

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log(`  ${audit.clusterNames.length} reroll scopes partitioning all ${audit.categoryKeys.length} axes`);
  console.log(`  every axis sized to a multiple of 16 (medium ${audit.counts.medium})`);
  console.log(`  ${blocks.length} inline script blocks, all parsing, no local script or stylesheet dependencies`);
  console.log(`  vocabulary.json and vocabulary.txt match the application, and llms.txt points at both`);
}
