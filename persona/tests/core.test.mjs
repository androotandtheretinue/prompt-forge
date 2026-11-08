import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/banks.js';
import '../src/archetypes.js';
import '../src/core.js';
const F = globalThis.PersonaForge;
const rolled = () => F.randomize(F.createDocument(), undefined, () => 0).document;

test('a new character has no assumed relationship or character license', () => {
  const doc = F.createDocument();
  assert.deepEqual(F.validateDocument(doc), []);
  assert.equal(doc.character.companion.enabled, false);
  for (const key of ['romance', 'erotic', 'changePolicy']) assert.equal(doc.character.companion[key], 'unspecified');
  assert.deepEqual(doc.character.companion.roles, []);
  assert.equal(doc.character.rights.license, 'unspecified');
  assert.equal(doc.character.essence, null);
});

test('rolls protect pinned text and deliberately pinned blanks', () => {
  const doc = rolled();
  doc.forge.locks.temperament = true; doc.forge.locks.values = true;
  doc.character.kernel.traits.values = F.entry('', 'manual', 'approved');
  const pinned = F.clone(doc.character.kernel.traits);
  for (let i = 0; i < 100; i++) {
    const next = F.randomize(doc).document;
    assert.deepEqual(next.character.kernel.traits.temperament, pinned.temperament);
    assert.deepEqual(next.character.kernel.traits.values, pinned.values);
  }
});

test('all roll paths preserve identity, relationship, optional modules, rights and settings', () => {
  let doc = rolled();
  doc = F.enableModule(doc, 'essence', true); doc = F.enableModule(doc, 'continuity', true);
  doc.character.kernel.name = F.entry('  Morrow 🜁  ', 'manual', 'approved');
  doc.character.essence.backstory = F.entry('A complicated history.');
  doc.character.continuity.notes = F.entry('Do not turn this into identity.');
  Object.assign(doc.character.companion, { enabled: true, roles: ['friendship', 'mentorship'], romance: 'nonsexual', erotic: 'permitted', changePolicy: 'confirm' });
  const original = F.clone(doc);
  for (const keys of [undefined, ['voice'], F.AXES.map(a => a.key)]) {
    const next = F.randomize(doc, keys, () => 0).document;
    assert.deepEqual(next.character.companion, original.character.companion);
    assert.deepEqual(next.character.essence, original.character.essence);
    assert.deepEqual(next.character.continuity, original.character.continuity);
    assert.deepEqual(next.character.kernel.name, original.character.kernel.name);
    assert.deepEqual(next.character.rights, original.character.rights);
    assert.deepEqual(next.forge, original.forge);
  }
  assert.deepEqual(doc, original, 'roll is pure');
});

test('rerolls visibly change a value while an alternative is available', () => {
  const doc = rolled(), before = F.clone(doc);
  const result = F.randomize(doc, ['temperament'], () => 0);
  assert.notEqual(result.document.character.kernel.traits.temperament.text, doc.character.kernel.traits.temperament.text);
  assert.deepEqual(doc, before);
  assert.deepEqual(Object.keys(result.changes), ['temperament']);
});

test('banishments persist through export/import and never re-enter exhausted draws', () => {
  let doc = F.createDocument();
  for (const item of doc.forge.banks.temperament) doc = F.banish(doc, 'temperament', item.text.toUpperCase());
  doc = F.importDocument(F.exportDocument(doc));
  const result = F.randomize(doc, ['temperament'], () => { throw new Error('must not draw'); });
  assert.equal(result.document.character.kernel.traits.temperament.text, '');
  assert.deepEqual(result.skipped, ['temperament']); assert.deepEqual(result.changes, {});
  const text = doc.forge.banks.temperament[0].text;
  const restored = F.restoreBanished(doc, 'temperament', text);
  assert.equal(F.availableBank(restored, 'temperament').length, 1);
  assert.equal(F.randomize(restored, ['temperament'], () => 0).document.character.kernel.traits.temperament.text, text);
});

test('one remaining current descriptor is a no-op without resetting approval', () => {
  let doc = F.replaceBank(F.createDocument(), 'voice', 'Only this one');
  doc.character.kernel.traits.voice = F.entry('Only this one', 'manual', 'approved');
  const result = F.randomize(doc, ['voice']);
  assert.deepEqual(result.document, doc); assert.deepEqual(result.changes, {});
});

test('bank editing preserves selected overrides and source IDs; empty banks are valid', () => {
  let doc = rolled();
  const original = F.clone(doc.character.kernel.traits.voice), bankItem = doc.forge.banks.voice[0];
  doc = F.replaceBank(doc, 'voice', `${bankItem.text}\nbrand new\nBRAND NEW\n\n`);
  assert.equal(doc.forge.banks.voice.length, 2);
  assert.equal(doc.forge.banks.voice[0].id, bankItem.id);
  assert.equal(doc.forge.banks.voice[1].origin, 'user');
  doc = F.replaceBank(doc, 'voice', '');
  assert.deepEqual(doc.character.kernel.traits.voice, original);
  assert.deepEqual(F.validateDocument(doc), []);
  assert.deepEqual(F.randomize(doc, ['voice']).document, doc);
});

test('a new draw carries bank provenance and suggested status independently', () => {
  const doc = F.replaceBank(F.createDocument(), 'quirk', 'Carries a tiny telescope');
  const result = F.randomize(doc, ['quirk'], () => 0).document;
  const trait = result.character.kernel.traits.quirk;
  assert.equal(trait.origin.kind, 'bank');
  assert.equal(trait.origin.reference, doc.forge.banks.quirk[0].id);
  assert.equal(trait.approval, 'suggested');
  trait.approval = 'approved'; assert.equal(trait.origin.kind, 'bank');
});

test('undo preserves later manual edits, approvals, pins, bans, and relationship changes', () => {
  const before = rolled(), roll = F.randomize(before, undefined, () => 0), after = roll.document;
  after.character.kernel.traits.voice = F.entry('My later edit', 'manual', 'draft');
  after.character.kernel.traits.humor.approval = 'approved';
  after.character.companion.erotic = 'excluded'; after.forge.locks.care = true;
  after.forge.banished.values.push('Something else');
  const result = F.undoRoll(after, roll.changes);
  assert.equal(result.document.character.kernel.traits.voice.text, 'My later edit');
  assert.equal(result.document.character.kernel.traits.humor.approval, 'approved');
  assert.equal(result.document.character.companion.erotic, 'excluded');
  assert.equal(result.document.forge.locks.care, true);
  assert.deepEqual(result.document.forge.banished.values, ['Something else']);
  assert.deepEqual(result.document.character.kernel.traits.temperament, before.character.kernel.traits.temperament);
  assert.deepEqual(result.preserved.sort(), ['humor', 'voice']);
});

test('JSON round-trip retains every supported module, Unicode, whitespace, origin and editorial status', () => {
  let doc = rolled();
  for (const key of ['essence', 'appearance', 'continuity']) doc = F.enableModule(doc, key, true);
  doc.character.kernel.name = F.entry('  Æther 🐙\nSecond line  ', 'manual', 'approved');
  doc.character.kernel.premise = F.entry('"Quoted"\\path\n\n  indentation\t終わり', 'ai-proposal', 'suggested', 'proposal:17');
  doc.character.essence.examples = F.entry('A: <hello>\nB: & goodbye.');
  doc.character.appearance.description = F.entry('Geometric and translucent.');
  doc.character.continuity.notes = F.entry('Source: a note, not an invented memory.');
  Object.assign(doc.character.companion, { enabled: true, roles: ['pet / familiar', 'custom role'], romance: 'none', erotic: 'permitted', changePolicy: 'fixed', approval: 'approved' });
  doc.character.companion.boundaries = F.entry('Ask before changing canon.', 'manual', 'approved');
  doc = F.replaceBank(doc, 'quirk', 'New custom detail\nAnother detail');
  doc = F.banish(doc, 'values', doc.forge.banks.values[0].text); doc.forge.locks.quirk = true;
  doc.extensions = { vendor: { state: [1, null, 'more data'], flag: false } };
  doc.character.extraOpaqueMetadata = { anything: 'retained, not compiled' };
  const first = F.exportDocument(doc), imported = F.importDocument(first), second = F.exportDocument(imported);
  assert.equal(second, first); assert.deepEqual(imported, doc);
});

test('round-trip remains exact over repeated creative edits and all roll scopes', () => {
  let doc = F.createDocument();
  for (let i = 0; i < 75; i++) {
    const key = F.AXES[i % F.AXES.length].key;
    doc = F.randomize(doc, i % 3 ? [key] : undefined).document;
    doc.forge.locks[key] = i % 4 === 0;
    if (i % 7 === 0) doc.character.kernel.traits[key] = F.entry(`Manual ${i} — 🧵\n `, 'manual', 'approved');
    const json = F.exportDocument(doc); doc = F.importDocument(json); assert.equal(F.exportDocument(doc), json);
  }
});

test('unsupported, malformed, incomplete and duplicate imports are rejected without mutating current work', () => {
  const current = rolled(), snapshot = F.exportDocument(current);
  const wrongVersion = F.clone(current); wrongVersion.schemaVersion = '2.0.0';
  const missing = F.clone(current); delete missing.character.kernel.traits.values;
  const invalidType = F.clone(current); invalidType.character.companion.roles = 'friendship';
  const duplicate = F.clone(current); duplicate.forge.banks.voice.push(F.clone(duplicate.forge.banks.voice[0]));
  const invalidApproval = F.clone(current); invalidApproval.character.kernel.name.approval = 'automatically true';
  for (const text of ['{oops', 'null', '[]', ...[wrongVersion, missing, invalidType, duplicate, invalidApproval].map(JSON.stringify)]) assert.throws(() => F.importDocument(text));
  assert.equal(F.exportDocument(current), snapshot);
  assert.throws(() => F.importDocument('{"__proto__":{}}'), /reserved key/);
});

test('deep and oversized JSON are refused with clear boundaries', () => {
  assert.throws(() => F.importDocument(' '.repeat(2_000_001)), /under 2 MB/);
  const doc = F.createDocument(); let nesting = doc.extensions;
  for (let i = 0; i < 40; i++) { nesting.child = {}; nesting = nesting.child; }
  assert.throws(() => F.importDocument(JSON.stringify(doc)), /nesting/);
});

test('Codify is deterministic, leaves original words intact and never changes canon', () => {
  const doc = rolled();
  const text = '  A quiet contradiction.\n\nNo elegant rewrite.  ';
  doc.character.kernel.traits.tension = F.entry(text, 'manual', 'draft');
  const before = F.exportDocument(doc), first = F.codify(doc), second = F.codify(doc);
  assert.deepEqual(first, second); assert.ok(first.markdown.includes(text));
  assert.equal(F.exportDocument(doc), before);
  assert.ok(first.markdown.includes('approval: draft'));
});

test('approved-only Markdown filters drafts without changing the full JSON document', () => {
  const doc = rolled();
  doc.character.kernel.name = F.entry('Unapproved name', 'manual', 'draft');
  doc.character.kernel.traits.temperament.approval = 'approved';
  const before = F.exportDocument(doc), output = F.codify(doc, { approvedOnly: true }).markdown;
  assert.ok(output.includes(doc.character.kernel.traits.temperament.text));
  assert.ok(!output.includes(doc.character.kernel.traits.values.text));
  assert.ok(!output.includes('Unapproved name'));
  assert.equal(F.exportDocument(doc), before);
});

test('Companion Sidecar remains separate and romance is independent of erotic configuration', () => {
  const doc = rolled();
  assert.equal(F.codify(doc).companion, null);
  Object.assign(doc.character.companion, { enabled: true, romance: 'nonsexual', erotic: 'permitted', changePolicy: 'confirm' });
  const output = F.codify(doc);
  assert.ok(!output.kernel.includes('Companion'));
  assert.ok(output.companion.includes('nonsexual')); assert.ok(output.companion.includes('permitted'));
  assert.ok(output.companion.includes('confirm'));
});

test('named snapshots restore the full document and remain independent of the current draft', () => {
  const memory = new Map(), storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const store = F.createStore(storage), doc = rolled(), first = F.exportDocument(doc);
  store.write(doc); assert.equal(F.exportDocument(store.read()), first);
  const slot = store.save('First sketch', doc, '2026-11-08T00:00:00Z');
  doc.character.kernel.traits.voice.text = 'Later edit'; store.write(doc);
  assert.equal(F.exportDocument(store.load(slot.id)), first);
  assert.equal(store.list().length, 1); store.remove(slot.id); assert.equal(store.list().length, 0);
});

test('unavailable storage and corrupt snapshots report failure rather than claiming a save', () => {
  const store = F.createStore({ getItem: () => '{corrupt', setItem: () => { throw new Error('Quota exceeded'); } });
  assert.throws(() => store.read(), /valid JSON/);
  assert.throws(() => store.write(rolled()), /Quota exceeded/);
  assert.throws(() => store.list());
});

test('invalid random sources and unknown axes cannot partially mutate a document', () => {
  const doc = rolled(), before = F.exportDocument(doc);
  assert.throws(() => F.randomize(doc, ['voice', 'unknown'], () => 0), /Unknown trait/);
  assert.throws(() => F.randomize(doc, ['voice'], () => -1), /invalid index/);
  assert.equal(F.exportDocument(doc), before);
});
