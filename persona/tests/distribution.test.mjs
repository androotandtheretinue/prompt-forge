import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('the shipped HTML exactly matches modular source and runs without external assets', async () => {
  let expected = await read('src/shell.html');
  for (const [marker, file] of [['STYLES', 'style.css'], ['BANKS', 'banks.js'], ['CORE', 'core.js'], ['APP', 'app.js']]) expected = expected.replace(`/* __${marker}__ */`, () => source[file]);
  const html = await read('index.html');
  assert.equal(html, expected);
  assert.ok(!/<script[^>]+src=/i.test(html));
  assert.ok(!/<link[^>]+(?:stylesheet|preload)/i.test(html));
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(html));
});
const source = Object.fromEntries(await Promise.all(['style.css', 'banks.js', 'core.js', 'app.js'].map(async name => [name, await read('src/' + name)])));

test('all shipped JavaScript parses as classic scripts for direct file opening', () => {
  for (const name of ['banks.js', 'core.js', 'app.js']) assert.doesNotThrow(() => new Function(source[name]));
});
