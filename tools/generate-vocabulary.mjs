/*
 * Writes every generated artifact: vocabulary.json, vocabulary.txt, and the
 * copy of llms.txt embedded in index.html.
 *
 * Run after changing any signal pool or llms.txt: `npm run vocabulary`. The
 * audit fails if any committed artifact does not match what this would
 * produce, so forgetting is caught rather than published.
 */
import fs from 'node:fs';
import { extractVocabulary, signalCount, toJson, toText, embedProtocol } from './vocabulary.mjs';

const root = new URL('../', import.meta.url);
const htmlPath = new URL('index.html', root);
const html = fs.readFileSync(htmlPath, 'utf8');
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
const llms = fs.readFileSync(new URL('llms.txt', root), 'utf8');

const vocabulary = extractVocabulary(html);

fs.writeFileSync(new URL('vocabulary.json', root), toJson(vocabulary, version));
fs.writeFileSync(new URL('vocabulary.txt', root), toText(vocabulary, version));

const embedded = embedProtocol(html, llms);
if (embedded !== html) fs.writeFileSync(htmlPath, embedded);

console.log(`Wrote vocabulary.json and vocabulary.txt — ${Object.keys(vocabulary).length} axes, ${signalCount(vocabulary).toLocaleString()} signals, version ${version}.`);
console.log(`Embedded llms.txt into index.html — ${(Buffer.byteLength(llms, 'utf8') / 1024).toFixed(1)} kB of protocol.`);
