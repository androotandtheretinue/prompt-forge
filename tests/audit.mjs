import fs from 'node:fs';
import vm from 'node:vm';
import { buildSingleFile, DIST_PATH, LAYER_PATH, SOURCE_PATH } from '../scripts/build.mjs';

const html = fs.readFileSync(SOURCE_PATH, 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(DIST_PATH)) {
  fail('dist/prompt-forge.html is missing. Run `npm run build`.');
} else if (fs.readFileSync(DIST_PATH, 'utf8') !== buildSingleFile()) {
  fail('dist/prompt-forge.html is stale. Run `npm run build`.');
}

/*
 * Take the LAST attribute-free <script> block. The previous pattern anchored on
 * `</script>\s*</body>` and matched from the first inline block to the last,
 * which meant that adding the v5 tag made it swallow `</script><script src=…>`
 * as if that were JavaScript. The harness then failed to parse the file it was
 * meant to be testing, and the audit silently verified nothing.
 */
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!blocks.length) {
  fail('Inline application script not found.');
  process.exit();
}

let script = blocks[blocks.length - 1][1];
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
if (total !== 2000) fail(`Expected 2,000 signals; found ${total}.`);
if (duplicateCount) fail(`Found ${duplicateCount} duplicate signals.`);
if (audit.cardCount !== 20) fail(`Expected 20 Forge Cards; found ${audit.cardCount}.`);
if (audit.presetErrors.length) fail(`Broken Forge Card values: ${JSON.stringify(audit.presetErrors)}`);
if (audit.missingMeta.length) fail(`Forge Cards missing metadata: ${audit.missingMeta.join(', ')}`);
if (audit.missingFromOrder.length || audit.extraInOrder.length) fail('Prompt order does not match the category registry.');
if (audit.clusterErrors.length) fail(`Broken cluster references: ${JSON.stringify(audit.clusterErrors)}`);

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

// The v5 layer is not executed here, but it must at least parse.
try {
  new vm.Script(fs.readFileSync(LAYER_PATH, 'utf8'));
} catch (error) {
  fail(`v5.js is invalid: ${error.message}`);
}

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log(`  ${audit.clusterNames.length} reroll scopes partitioning all ${audit.categoryKeys.length} axes`);
  console.log('  v5 layer parses; dist/prompt-forge.html matches the build');
}
