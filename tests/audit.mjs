import fs from 'node:fs';
import vm from 'node:vm';

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

// Prompt Forge is one file. Nothing may reintroduce an external dependency.
const externalScripts = [...html.matchAll(/<script\s[^>]*src=["']([^"']+)["']/g)].map(match => match[1]);
const localScripts = externalScripts.filter(src => !/^(https?:)?\/\//.test(src));
if (localScripts.length) fail(`index.html is not self-contained; it loads ${localScripts.join(', ')}.`);

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log(`  ${audit.clusterNames.length} reroll scopes partitioning all ${audit.categoryKeys.length} axes`);
  console.log(`  ${blocks.length} inline script blocks, all parsing, no local script dependencies`);
}
