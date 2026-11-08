import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let html = await readFile(root + 'src/shell.html', 'utf8');
for (const [marker, file] of [['STYLES', 'style.css'], ['BANKS', 'banks.js'], ['ARCHETYPES', 'archetypes.js'], ['CORE', 'core.js'], ['APP', 'app.js']]) {
  const content = await readFile(root + 'src/' + file, 'utf8');
  if (/<\/script/i.test(content)) throw new Error(`${file} contains a script terminator.`);
  html = html.replace(`/* __${marker}__ */`, () => content);
}
await writeFile(root + 'index.html', html);
console.log('Built self-contained index.html; no runtime dependencies.');
