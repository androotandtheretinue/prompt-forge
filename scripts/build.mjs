/*
 * Builds the single-file distribution.
 *
 * Prompt Forge is meant to be one file you can save and open offline. Since
 * v5 the source is split — index.html plus v5.js — so the distribution is no
 * longer a byte-for-byte copy of index.html. This inlines the v5 layer at the
 * exact point index.html loads it, producing a self-contained page.
 *
 * The filename is deliberately version-agnostic. The previous convention baked
 * "4.0.0" into the path, and it went stale the moment the version moved.
 */
import fs from 'node:fs';

const ROOT = new URL('../', import.meta.url);

export const SOURCE_PATH = new URL('index.html', ROOT);
export const LAYER_PATH = new URL('v5.js', ROOT);
export const DIST_PATH = new URL('dist/prompt-forge.html', ROOT);

const SCRIPT_TAG = '<script src="v5.js"></script>';

export function buildSingleFile() {
  const html = fs.readFileSync(SOURCE_PATH, 'utf8');
  const layer = fs.readFileSync(LAYER_PATH, 'utf8');

  if (!html.includes(SCRIPT_TAG)) {
    throw new Error(`index.html no longer contains ${SCRIPT_TAG}; update scripts/build.mjs.`);
  }
  if (layer.includes('</script')) {
    throw new Error('v5.js contains a script terminator and cannot be inlined safely.');
  }

  return html.replace(SCRIPT_TAG, `<script>\n${layer}\n</script>`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(new URL('dist/', ROOT), { recursive: true });
  fs.writeFileSync(DIST_PATH, buildSingleFile());
  console.log('Wrote dist/prompt-forge.html');
}
