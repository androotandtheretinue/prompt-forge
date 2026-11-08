import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/banks.js';
import '../src/archetypes.js';
import '../src/core.js';
const F = globalThis.PersonaForge;
const pick = (doc, text) => F.selectArchetype(doc, doc.forge.banks.archetype.find(item => item.text === text).id);

test('the fiction bank spans nine families and personality banks include a wider range', () => {
  const doc = F.createDocument();
  assert.equal(doc.forge.banks.archetype.length, 144);
  assert.equal(new Set(doc.forge.banks.archetype.map(item => item.group)).size, 9);
  for (const {key} of F.AXES) assert.equal(doc.forge.banks[key].length, 32);
  for (const text of ['Tyrant','Lovable fool','Rogue android','Friendly abomination','Byronic hero','Tsundere','Chuunibyou dreamer']) assert.ok(doc.forge.banks.archetype.some(item => item.text === text));
  assert.deepEqual(F.validateDocument(doc), []);
});

test('multiple contradictory fictional roles coexist without rewriting personality or relationship', () => {
  let doc = F.createDocument();
  doc.character.kernel.traits.temperament = F.entry('Timid and compassionate', 'manual', 'approved');
  const originalPersonality = F.clone(doc.character.kernel.traits), relationship = F.clone(doc.character.companion);
  for (const text of ['Tyrant','Wise mentor','Shipboard intelligence','Lovable fool']) doc = pick(doc, text);
  assert.deepEqual(doc.character.kernel.archetypes.map(item => item.text), ['Tyrant','Wise mentor','Shipboard intelligence','Lovable fool']);
  assert.deepEqual(doc.character.kernel.traits, originalPersonality);
  assert.deepEqual(doc.character.companion, relationship);
});

test('archetype pins protect text and blanks through individual and full rolls', () => {
  let doc = pick(F.createDocument(), 'Knight-errant');
  for (const item of doc.character.kernel.archetypes) doc.forge.archetypeLocks[item.id] = true;
  const before = F.clone(doc.character.kernel.archetypes);
  for (const keys of [undefined, ['archetypes'], [`archetype:${before[0].id}`]]) {
    const next = F.randomize(doc, keys, () => 0).document;
    assert.deepEqual(next.character.kernel.archetypes, before);
  }
});

test('archetype draws avoid duplicates and immediate repeats without touching personality', () => {
  let doc = F.addArchetype(F.addArchetype(F.createDocument()));
  const personality = F.clone(doc.character.kernel.traits);
  doc = F.randomize(doc, ['archetypes'], () => 0).document;
  const texts = doc.character.kernel.archetypes.map(item => item.text);
  assert.equal(new Set(texts).size, 4);
  const next = F.randomize(doc, ['archetypes'], () => 0).document;
  next.character.kernel.archetypes.forEach((item, index) => assert.notEqual(item.text, texts[index]));
  assert.deepEqual(next.character.kernel.traits, personality);
});

test('a banished archetype stays out of all draws; exhausted archetype banks are no-ops', () => {
  let doc = F.createDocument();
  doc = F.banish(doc, 'archetype', 'RELUCTANT HERO');
  doc = F.randomize(doc, ['archetypes'], () => 0).document;
  assert.ok(!doc.character.kernel.archetypes.some(item => item.text === 'Reluctant hero'));
  doc.forge.banks.archetype.forEach(item => { doc = F.banish(doc, 'archetype', item.text); });
  assert.deepEqual(F.randomize(doc, ['archetypes']).document, doc);
});

test('undo identifies archetypes by stable ID and preserves later edits and removals', () => {
  const doc = F.createDocument(), roll = F.randomize(doc, ['archetypes'], () => 0);
  const first = roll.document.character.kernel.archetypes[0];
  first.text = 'A later custom role'; first.origin = {kind:'manual',reference:null}; first.approval = 'draft';
  const removedId = roll.document.character.kernel.archetypes[1].id;
  const removed = F.removeArchetype(roll.document, removedId);
  const undone = F.undoRoll(removed, roll.changes);
  assert.equal(undone.document.character.kernel.archetypes.length, 1);
  assert.equal(undone.document.character.kernel.archetypes[0].text, 'A later custom role');
  assert.equal(undone.preserved.length, 2);
});

test('archetype text, order, provenance, approvals, pins and custom bank metadata round-trip exactly', () => {
  let doc = pick(pick(F.createDocument(), 'Confidence artist'), 'Cursed immortal');
  doc = F.addArchetype(doc, '  My own impossible role 🜁\nwith a second line  ');
  doc.character.kernel.archetypes[0].approval = 'approved';
  doc.forge.archetypeLocks[doc.character.kernel.archetypes[1].id] = true;
  doc.forge.banks.archetype.push({id:'custom:test-role',text:'A homegrown role',origin:'user',group:'My fiction'});
  const json = F.exportDocument(doc);
  assert.equal(F.exportDocument(F.importDocument(json)), json);
  const markdown = F.codify(doc);
  assert.ok(markdown.kernel.includes('Confidence artist'));
  assert.ok(markdown.kernel.includes('Cursed immortal'));
  assert.ok(markdown.kernel.includes('  My own impossible role 🜁\nwith a second line  '));
  const approved = F.codify(doc,{approvedOnly:true});
  assert.ok(approved.kernel.includes('Confidence artist')); assert.ok(!approved.kernel.includes('Cursed immortal'));
});

test('old 1.0 saves migrate deterministically without inventing roles or replacing curated banks', () => {
  const old = F.createDocument(); old.schemaVersion = '1.0.0';
  delete old.character.kernel.archetypes; delete old.forge.archetypeLocks;
  delete old.forge.banks.archetype; delete old.forge.banished.archetype;
  old.forge.banks.temperament = [{id:'custom:legacy',text:'An older custom signal',origin:'user'}];
  old.character.kernel.traits.temperament = F.entry('A pinned custom override','manual','approved'); old.forge.locks.temperament = true;
  old.extensions = {oldSystem:{extra:'retained'}};
  const before = F.clone(old), migrated = F.importDocument(JSON.stringify(old));
  assert.equal(migrated.schemaVersion,'1.1.0');
  assert.deepEqual(migrated.character.kernel.archetypes, []);
  assert.deepEqual(migrated.forge.banks.temperament, before.forge.banks.temperament);
  assert.deepEqual(migrated.character.kernel.traits, before.character.kernel.traits);
  assert.deepEqual(migrated.forge.locks, before.forge.locks);
  assert.deepEqual(migrated.extensions, before.extensions);
  assert.equal(F.exportDocument(migrated),F.exportDocument(F.importDocument(JSON.stringify(old))));
  assert.deepEqual(old,before);
});

test('zero archetypes is a deliberate omission and whole-character rolls keep it empty', () => {
  let doc = F.createDocument();
  for (const item of [...doc.character.kernel.archetypes]) doc = F.removeArchetype(doc,item.id);
  assert.deepEqual(F.randomize(doc).document.character.kernel.archetypes, []);
  assert.deepEqual(F.validateDocument(doc), []);
});

test('malformed archetype collections, duplicate IDs and missing locks are refused', () => {
  const wrongShape = F.createDocument(); wrongShape.character.kernel.archetypes = 'Tyrant';
  const duplicate = F.createDocument(); duplicate.character.kernel.archetypes[1].id = duplicate.character.kernel.archetypes[0].id;
  const missingLock = F.createDocument(); delete missingLock.forge.archetypeLocks[missingLock.character.kernel.archetypes[0].id];
  for (const doc of [wrongShape,duplicate,missingLock]) assert.throws(()=>F.importDocument(JSON.stringify(doc)));
});

test('adding updated starter signals is explicit and preserves existing custom source IDs', () => {
  let doc = F.createDocument();
  doc.forge.banks.temperament = [{id:'custom:mine',text:'My strange temperament',origin:'user'}];
  const text = ['My strange temperament',...F.starterBank('temperament').map(item=>item.text)].join('\n');
  const updated = F.replaceBank(doc,'temperament',text,{includeStarters:true});
  assert.equal(updated.forge.banks.temperament.length,33);
  assert.equal(updated.forge.banks.temperament[0].id,'custom:mine');
  assert.equal(updated.forge.banks.temperament[1].id,'starter:temperament:1');
  assert.deepEqual(doc.forge.banks.temperament,[{id:'custom:mine',text:'My strange temperament',origin:'user'}]);
});

test('bulk starter expansion preserves curation, bans, identity and valid IDs even with source-looking custom IDs', () => {
  let doc = F.createDocument();
  doc.forge.banks.temperament = [{id:'starter:temperament:17',text:'Custom signal sharing an old-looking ID',origin:'user'}];
  doc = F.banish(doc,'temperament','Haughty and easily offended');
  doc.character.kernel.traits.temperament = F.entry('My unchanged canon','manual','approved');
  doc.forge.locks.temperament = true;
  const before = F.clone(doc), result = F.addMissingStarters(doc);
  assert.equal(result.added,32);
  assert.deepEqual(result.document.character,before.character);
  assert.deepEqual(result.document.forge.banished,before.forge.banished);
  assert.deepEqual(result.document.forge.locks,before.forge.locks);
  assert.equal(result.document.forge.banks.temperament[0].id,'starter:temperament:17');
  assert.equal(new Set(result.document.forge.banks.temperament.map(item=>item.id)).size,33);
  assert.deepEqual(F.validateDocument(result.document),[]);
  assert.equal(F.addMissingStarters(result.document).added,0);
  assert.deepEqual(doc,before);
});
