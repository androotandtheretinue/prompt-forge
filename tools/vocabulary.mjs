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

/*
 * The protocol, embedded in the page.
 *
 * index.html is the URL people share and therefore the one an agent is most
 * likely to fetch, so it carries llms.txt verbatim rather than a pointer to it.
 * Both the reader and the extractor are named by these markers, which is why
 * this is a generated region and not something to edit by hand.
 */
export const PROTOCOL_BEGIN = '<!-- BEGIN llms.txt -->';
export const PROTOCOL_END = '<!-- END llms.txt -->';

export function protocolBlock(llms) {
  // The copy lives inside a <script>, which ends at the first literal closing
  // tag regardless of context. Nothing in llms.txt has ever contained one, and
  // if that changes the page would break silently rather than loudly.
  if (/<\/script/i.test(llms)) {
    throw new Error('llms.txt contains a closing script tag and cannot be embedded verbatim.');
  }
  return `${PROTOCOL_BEGIN}\n${llms.trimEnd()}\n${PROTOCOL_END}`;
}

export function embedProtocol(html, llms) {
  const start = html.indexOf(PROTOCOL_BEGIN);
  const end = html.indexOf(PROTOCOL_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html has no llms.txt embed markers.');
  }
  return html.slice(0, start) + protocolBlock(llms) + html.slice(end + PROTOCOL_END.length);
}

export function extractProtocol(html) {
  const start = html.indexOf(PROTOCOL_BEGIN);
  const end = html.indexOf(PROTOCOL_END);
  if (start === -1 || end === -1 || end < start) return null;
  return html.slice(start + PROTOCOL_BEGIN.length, end).trim();
}

/*
 * Mirrors.
 *
 * Some agents run fetchers that allowlist hosts, and *.github.io is not always
 * on the list. That blocks the front door and llms.txt itself, so a reader can
 * fail before reaching any instruction explaining the alternative. The mirror
 * addresses therefore travel inside the vocabulary files as well as in
 * llms.txt — whichever door a reader gets through, it carries the other one.
 *
 * Both track `main` and move as the vocabulary grows. Pin a commit SHA in place
 * of `main` to cite a fixed vocabulary.
 */
const RAW = 'https://raw.githubusercontent.com/androotandtheretinue/prompt-forge/main';
export const MIRRORS = {
  json: `${RAW}/vocabulary.json`,
  text: `${RAW}/vocabulary.txt`,
  instructions: `${RAW}/llms.txt`
};

export function toJson(vocabulary, version) {
  return `${JSON.stringify({
    name: 'Prompt Forge',
    version,
    description: 'Signal vocabulary for Prompt Forge, a public-domain visual prompt instrument. Build a prompt by choosing at most one signal per axis.',
    license: 'CC0-1.0',
    instructions: 'llms.txt',
    source: 'index.html',
    generator: 'npm run vocabulary',
    access_note: 'Nothing here is gated. If *.github.io is blocked by your fetcher, use the mirrors below — same files, plain text.',
    mirrors: MIRRORS,
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
    'stated idea. Use only the values listed here, and only in the axis that',
    'lists them. Omit any axis that does not serve the idea. Read llms.txt',
    'first for the full operating instruction.',
    '',
    'Nothing here is gated. If *.github.io is blocked by your fetcher, these',
    'same files are served as plain text from:',
    `  ${MIRRORS.instructions}`,
    `  ${MIRRORS.json}`,
    `  ${MIRRORS.text}`,
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
