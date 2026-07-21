import fs from 'node:fs';
import vm from 'node:vm';

const sourcePath = new URL('../index.html', import.meta.url);
const distPath = new URL('../dist/prompt-forge-v4.0.0.html', import.meta.url);
const html = fs.readFileSync(sourcePath, 'utf8');
const dist = fs.readFileSync(distPath, 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

if (html !== dist) fail('index.html and the versioned distribution file differ.');

const match = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!match) {
  fail('Inline application script not found.');
  process.exit();
}

let script = match[1];
script += `
globalThis.__forgeAudit = {
  counts: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).length])),
  duplicates: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).filter((option, index, all) => all.indexOf(option) !== index)])),
  presetErrors: Object.entries(presets).flatMap(([name, preset]) => Object.entries(preset).filter(([key, value]) => !categories[key] || !categories[key].options.includes(value)).map(([key, value]) => ({ name, key, value }))),
  missingMeta: Object.keys(presets).filter(name => !presetMeta[name]),
  missingFromOrder: Object.keys(categories).filter(key => !promptOrder.includes(key)),
  extraInOrder: promptOrder.filter(key => !categories[key]),
  clusterErrors: Object.entries(categoryClusters).flatMap(([name, keys]) => keys.filter(key => !categories[key]).map(key => ({ name, key }))),
  cardCount: Object.keys(presets).length
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

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log('  distribution file matches index.html');
}
