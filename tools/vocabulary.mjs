/*
 * Shared vocabulary extraction and rendering.
 *
 * The published vocabulary files are generated from index.html rather than
 * maintained beside it, because a hand-maintained copy of 2,032 strings is a
 * copy that will eventually lie. tools/generate-vocabulary.mjs writes them and
 * tests/audit.mjs regenerates them in memory and compares, so a stale file is a
 * failing test rather than a quiet inaccuracy on a public URL.
 *
 * Both callers share this module so there is exactly one definition of what the
 * files should contain.
 */
import vm from 'node:vm';

const APP_MARKER = 'const categories = {';

/*
 * Execute the application's inline block and read the finished category
 * registry out of it. Reading the source text instead would have to re-implement
 * the v4 expansion merge and the three categories appended after the object
 * literal; running it gets the same answer the browser gets.
 */
export function extractVocabulary(html) {
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const appBlocks = blocks.filter(block => block.includes(APP_MARKER));
  if (appBlocks.length !== 1) {
    throw new Error(`Expected exactly one inline block defining \`${APP_MARKER}\`; found ${appBlocks.length}.`);
  }

  const context = { console, document: { addEventListener() {} } };
  vm.createContext(context);
  vm.runInContext(`${appBlocks[0]}
globalThis.__vocab = {
  order: promptOrder.slice(),
  axes: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, {
    label: category.label,
    icon: category.icon,
    options: category.options.filter(option => !option.startsWith('—'))
  }]))
};`, context);

  const { order, axes } = context.__vocab;
  // promptOrder is the sequence signals occupy in a built prompt. The audit
  // already proves it matches the registry exactly, so it is a safe key order
  // and a more useful one than object insertion order.
  return Object.fromEntries(order.map(key => [key, axes[key]]));
}

export function signalCount(vocabulary) {
  return Object.values(vocabulary).reduce((sum, axis) => sum + axis.options.length, 0);
}

export function toJson(vocabulary, version) {
  return `${JSON.stringify({
    name: 'Prompt Forge',
    version,
    description: 'Signal vocabulary for Prompt Forge, a public-domain visual prompt instrument. Build a prompt by choosing at most one signal per axis.',
    license: 'CC0-1.0',
    instructions: 'llms.txt',
    source: 'index.html',
    generator: 'npm run vocabulary',
    axis_count: Object.keys(vocabulary).length,
    signal_count: signalCount(vocabulary),
    axis_order: Object.keys(vocabulary),
    axes: Object.fromEntries(Object.entries(vocabulary).map(([key, axis]) => [key, {
      label: axis.label,
      count: axis.options.length,
      options: axis.options
    }]))
  }, null, 2)}\n`;
}

export function toText(vocabulary, version) {
  const total = signalCount(vocabulary);
  const axes = Object.keys(vocabulary);
  const lines = [
    'PROMPT FORGE — SIGNAL VOCABULARY',
    `version ${version} · ${axes.length} axes · ${total} signals · CC0-1.0`,
    '',
    'Build a prompt by choosing at most one signal per axis, in service of one',
    'stated idea. Use only the values listed here. Omit any axis that does not',
    'serve the idea. Read llms.txt first for the full operating instruction.',
    '',
    `Axis order in a built prompt: ${axes.join(', ')}`,
    ''
  ];

  for (const [key, axis] of Object.entries(vocabulary)) {
    lines.push('='.repeat(72));
    lines.push(`${key.toUpperCase()} — ${axis.label} (${axis.options.length} signals)`);
    lines.push('='.repeat(72));
    lines.push(...axis.options);
    lines.push('');
  }

  return `${lines.join('\n')}`;
}
