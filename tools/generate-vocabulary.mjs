/*
 * Writes vocabulary.json and vocabulary.txt from index.html.
 *
 * Run after changing any signal pool: `npm run vocabulary`. The audit fails if
 * the committed files do not match what this would produce, so forgetting is
 * caught rather than published.
 */
import fs from 'node:fs';
import { extractVocabulary, signalCount, toJson, toText } from './vocabulary.mjs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));

const vocabulary = extractVocabulary(html);

fs.writeFileSync(new URL('vocabulary.json', root), toJson(vocabulary, version));
fs.writeFileSync(new URL('vocabulary.txt', root), toText(vocabulary, version));

console.log(`Wrote vocabulary.json and vocabulary.txt — ${Object.keys(vocabulary).length} axes, ${signalCount(vocabulary).toLocaleString()} signals, version ${version}.`);
