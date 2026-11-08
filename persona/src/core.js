/* Persona Prompt Forge 0.1.0 — pure document operations. CC0-1.0. */
(() => {
  'use strict';
  const FORMAT = 'persona-prompt-forge';
  const VERSION = '1.0.0';
  const AXES = globalThis.PersonaForgeBanks.map(({ key, label, hint }) => ({ key, label, hint }));
  const APPROVALS = ['draft', 'suggested', 'approved'];
  const ORIGINS = ['unspecified', 'manual', 'bank', 'ai-proposal', 'imported'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const normalize = text => text.trim().toLowerCase();
  const id = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const entry = (text = '', kind = 'unspecified', approval = 'draft', reference = null) => ({ text, origin: { kind, reference }, approval });

  function createDocument() {
    return {
      format: FORMAT,
      schemaVersion: VERSION,
      character: {
        id: id(),
        rights: { license: 'unspecified', attribution: '' },
        kernel: {
          name: entry(), pronouns: entry(), premise: entry(),
          traits: Object.fromEntries(AXES.map(({ key }) => [key, entry()]))
        },
        essence: null,
        companion: {
          enabled: false, roles: [], romance: 'unspecified', erotic: 'unspecified',
          customRoles: entry(), dynamics: entry(), boundaries: entry(), expectations: entry(),
          changePolicy: 'unspecified', origin: { kind: 'unspecified', reference: null }, approval: 'draft'
        },
        appearance: null,
        continuity: null
      },
      forge: {
        banks: Object.fromEntries(globalThis.PersonaForgeBanks.map(({ key, options }) => [key,
          options.map((text, index) => ({ id: `starter:${key}:${index + 1}`, text, origin: 'builtin' }))
        ])),
        locks: Object.fromEntries(AXES.map(({ key }) => [key, false])),
        banished: Object.fromEntries(AXES.map(({ key }) => [key, []]))
      },
      extensions: {}
    };
  }

  function stableStringify(value) {
    const sort = item => Array.isArray(item) ? item.map(sort) : item && typeof item === 'object'
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, sort(item[key])])) : item;
    return JSON.stringify(sort(value), null, 2) + '\n';
  }

  function validateDocument(doc) {
    const errors = [];
    const fail = (path, message) => errors.push(`${path}: ${message}`);
    const object = (value, path) => {
      const ok = value !== null && typeof value === 'object' && !Array.isArray(value);
      if (!ok) fail(path, 'expected an object');
      return ok;
    };
    const string = (value, path) => { if (typeof value !== 'string') fail(path, 'expected text'); };
    const choice = (value, list, path) => { if (!list.includes(value)) fail(path, `expected ${list.join(', ')}`); };
    const strings = (value, path) => {
      if (!Array.isArray(value)) fail(path, 'expected a text list');
      else value.forEach((v, i) => string(v, `${path}[${i}]`));
    };
    const origin = (value, path) => {
      if (!object(value, path)) return;
      choice(value.kind, ORIGINS, `${path}.kind`);
      if (value.reference !== null) string(value.reference, `${path}.reference`);
    };
    const field = (value, path) => {
      if (!object(value, path)) return;
      string(value.text, `${path}.text`);
      origin(value.origin, `${path}.origin`);
      choice(value.approval, APPROVALS, `${path}.approval`);
    };
    // Reject poison keys before any data reaches mutable application objects.
    function safeKeys(value, path = '$', depth = 0) {
      if (depth > 32) { fail(path, 'nesting is too deep'); return; }
      if (!value || typeof value !== 'object') return;
      for (const key of Object.keys(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(`${path}.${key}`, 'reserved key');
        safeKeys(value[key], `${path}.${key}`, depth + 1);
      }
    }
    safeKeys(doc);
    if (!object(doc, '$')) return errors;
    if (doc.format !== FORMAT) fail('format', 'not a Persona Prompt Forge document');
    if (doc.schemaVersion !== VERSION) fail('schemaVersion', `unsupported version; expected ${VERSION}`);
    if (object(doc.character, 'character')) {
      const c = doc.character;
      string(c.id, 'character.id');
      if (object(c.rights, 'character.rights')) {
        string(c.rights.license, 'character.rights.license');
        string(c.rights.attribution, 'character.rights.attribution');
      }
      if (object(c.kernel, 'character.kernel')) {
        for (const key of ['name', 'pronouns', 'premise']) field(c.kernel[key], `kernel.${key}`);
        if (object(c.kernel.traits, 'kernel.traits')) {
          AXES.forEach(({ key }) => field(c.kernel.traits[key], `kernel.traits.${key}`));
          Object.keys(c.kernel.traits).filter(key => !AXES.some(a => a.key === key))
            .forEach(key => field(c.kernel.traits[key], `kernel.traits.${key}`));
        }
      }
      const optional = (key, fields) => {
        if (c[key] !== null && object(c[key], key)) fields.forEach(name => field(c[key][name], `${key}.${name}`));
      };
      optional('essence', ['backstory', 'voiceNotes', 'examples']);
      optional('appearance', ['description']);
      optional('continuity', ['notes']);
      if (object(c.companion, 'companion')) {
        const p = c.companion;
        if (typeof p.enabled !== 'boolean') fail('companion.enabled', 'expected true or false');
        strings(p.roles, 'companion.roles');
        choice(p.romance, ['unspecified', 'none', 'nonsexual', 'romantic'], 'companion.romance');
        choice(p.erotic, ['unspecified', 'excluded', 'permitted'], 'companion.erotic');
        choice(p.changePolicy, ['unspecified', 'fixed', 'evolving', 'confirm'], 'companion.changePolicy');
        origin(p.origin, 'companion.origin');
        choice(p.approval, APPROVALS, 'companion.approval');
        ['customRoles', 'dynamics', 'boundaries', 'expectations'].forEach(key => field(p[key], `companion.${key}`));
      }
    }
    if (object(doc.forge, 'forge')) {
      const f = doc.forge;
      if (object(f.banks, 'forge.banks')) AXES.forEach(({ key }) => {
        const bank = f.banks[key];
        if (!Array.isArray(bank)) { fail(`banks.${key}`, 'expected a list'); return; }
        const ids = new Set(), texts = new Set();
        bank.forEach((item, i) => {
          const path = `banks.${key}[${i}]`;
          if (!object(item, path)) return;
          string(item.id, `${path}.id`); string(item.text, `${path}.text`);
          choice(item.origin, ['builtin', 'user', 'imported', 'ai-proposal'], `${path}.origin`);
          if (typeof item.text === 'string') {
            const norm = normalize(item.text);
            if (!norm) fail(`${path}.text`, 'descriptor must not be blank');
            if (texts.has(norm)) fail(path, 'duplicate descriptor');
            texts.add(norm);
          }
          if (ids.has(item.id)) fail(path, 'duplicate descriptor id');
          ids.add(item.id);
        });
      });
      if (object(f.locks, 'forge.locks')) AXES.forEach(({ key }) => {
        if (typeof f.locks[key] !== 'boolean') fail(`locks.${key}`, 'expected true or false');
      });
      if (object(f.banished, 'forge.banished')) AXES.forEach(({ key }) => strings(f.banished[key], `banished.${key}`));
    }
    object(doc.extensions, 'extensions');
    return errors;
  }

  function importDocument(text) {
    if (typeof text !== 'string' || text.length > 2_000_000) throw new Error('Import must be a JSON document under 2 MB.');
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error('This is not valid JSON.'); }
    const errors = validateDocument(parsed);
    if (errors.length) throw new Error(errors.slice(0, 4).join('\n'));
    return clone(parsed); // Preserve provenance, approvals, unknown data, and text verbatim.
  }

  function exportDocument(doc) {
    const errors = validateDocument(doc);
    if (errors.length) throw new Error(errors.slice(0, 4).join('\n'));
    return stableStringify(doc);
  }

  function randomIndex(max) {
    if (!Number.isInteger(max) || max < 1) throw new Error('Cannot draw from an empty pool.');
    if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * max);
    const limit = Math.floor(4294967296 / max) * max;
    const data = new Uint32Array(1);
    do { globalThis.crypto.getRandomValues(data); } while (data[0] >= limit);
    return data[0] % max;
  }

  function availableBank(doc, key) {
    const banned = new Set(doc.forge.banished[key].map(normalize));
    return doc.forge.banks[key].filter(item => !banned.has(normalize(item.text)));
  }

  function randomize(doc, keys = AXES.map(a => a.key), rng = randomIndex) {
    const next = clone(doc), changes = {}, skipped = [];
    for (const key of new Set(keys)) {
      if (!AXES.some(axis => axis.key === key)) throw new Error(`Unknown trait: ${key}`);
      if (next.forge.locks[key]) continue;
      const before = next.character.kernel.traits[key];
      const pool = availableBank(next, key);
      const alternatives = pool.filter(item => normalize(item.text) !== normalize(before.text));
      // One remaining descriptor already on screen is a no-op, not a new suggestion.
      if (!alternatives.length) { skipped.push(key); continue; }
      const index = rng(alternatives.length);
      if (!Number.isInteger(index) || index < 0 || index >= alternatives.length) throw new Error('Random source returned an invalid index.');
      const selected = alternatives[index];
      const after = entry(selected.text, 'bank', 'suggested', selected.id);
      changes[key] = { before: clone(before), after: clone(after) };
      next.character.kernel.traits[key] = after;
    }
    return { document: next, changes, skipped };
  }

  function undoRoll(doc, changes) {
    const next = clone(doc), restored = [], preserved = [];
    for (const [key, change] of Object.entries(changes)) {
      if (same(next.character.kernel.traits[key], change.after)) {
        next.character.kernel.traits[key] = clone(change.before); restored.push(key);
      } else preserved.push(key); // An edit or approval made after the roll wins.
    }
    return { document: next, restored, preserved };
  }

  function banish(doc, key, text) {
    const next = clone(doc);
    if (!normalize(text)) return next;
    if (!next.forge.banished[key].some(value => normalize(value) === normalize(text))) next.forge.banished[key].push(text);
    return next;
  }

  function restoreBanished(doc, key, text) {
    const next = clone(doc);
    next.forge.banished[key] = next.forge.banished[key].filter(value => normalize(value) !== normalize(text));
    return next;
  }

  function replaceBank(doc, key, lines) {
    const next = clone(doc), seen = new Set(), bank = [];
    for (const raw of lines.split(/\r?\n/)) {
      const text = raw.trim(), norm = normalize(text);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      const existing = next.forge.banks[key].find(item => normalize(item.text) === norm);
      bank.push(existing ? { ...existing, text } : { id: `custom:${id()}`, text, origin: 'user' });
    }
    next.forge.banks[key] = bank;
    return next; // Removing a bank entry never deletes selected character text.
  }

  const moduleFields = {
    essence: ['backstory', 'voiceNotes', 'examples'], appearance: ['description'], continuity: ['notes']
  };
  function enableModule(doc, key, enabled) {
    if (!moduleFields[key]) throw new Error('Unknown optional module.');
    const next = clone(doc);
    // Toggling off is handled by the UI as collapsing, not erasing authored text.
    if (enabled && next.character[key] === null) next.character[key] = Object.fromEntries(moduleFields[key].map(k => [k, entry()]));
    return next;
  }

  function codify(doc, { approvedOnly = false } = {}) {
    const c = doc.character;
    const include = item => item?.text.trim() && (!approvedOnly || item.approval === 'approved');
    const linesFor = (label, item) => include(item)
      ? [`### ${label}`, item.text, '', `_Origin: ${item.origin.kind}${item.origin.reference ? ` (${item.origin.reference})` : ''}; approval: ${item.approval}._`, ''] : [];
    const name = c.kernel.name.text.trim() ? c.kernel.name.text : 'Untitled persona';
    const kernel = ['## Identity Kernel', ''];
    for (const [key, label] of [['name', 'Name'], ['pronouns', 'Pronouns'], ['premise', 'Premise']]) kernel.push(...linesFor(label, c.kernel[key]));
    const ordered = [...AXES.map(a => [a.key, a.label]), ...Object.keys(c.kernel.traits)
      .filter(key => !AXES.some(a => a.key === key)).sort().map(key => [key, key])];
    for (const [key, label] of ordered) kernel.push(...linesFor(label, c.kernel.traits[key]));
    const makeModule = (title, value, fields) => value === null ? null
      : [`## ${title}`, '', ...fields.flatMap(([key, label]) => linesFor(label, value[key]))].join('\n').trimEnd() + '\n';
    const essence = makeModule('Essence Enrichment', c.essence, [['backstory', 'Backstory'], ['voiceNotes', 'Voice notes'], ['examples', 'Example dialogue']]);
    const appearance = makeModule('Appearance', c.appearance, [['description', 'Description']]);
    const continuity = makeModule('Continuity & Memory', c.continuity, [['notes', 'Continuity notes']]);
    let companion = null;
    const p = c.companion;
    if (p.enabled) {
      const lines = ['## Companion Sidecar', ''];
      if (!approvedOnly || p.approval === 'approved') {
        for (const [label, text] of [
          ['Roles', p.roles.join(', ') || 'unspecified'], ['Romance', p.romance], ['Erotic interaction', p.erotic], ['Canonical change policy', p.changePolicy]
        ]) lines.push(`### ${label}`, text, '');
        lines.push(`_Configuration origin: ${p.origin.kind}; approval: ${p.approval}._`, '');
      }
      for (const [key, label] of [['customRoles', 'Custom roles'], ['dynamics', 'Dynamics'], ['boundaries', 'Boundaries'], ['expectations', 'Expectations']]) lines.push(...linesFor(label, p[key]));
      companion = lines.join('\n').trimEnd() + '\n';
    }
    const parts = { kernel: kernel.join('\n').trimEnd() + '\n', essence, companion, appearance, continuity };
    const headingName = approvedOnly && c.kernel.name.approval !== 'approved' ? 'Persona' : name;
    const markdown = [`# ${headingName}`, '', `_Persona Prompt Forge · schema ${VERSION} · ${approvedOnly ? 'approved entries only' : 'all selected entries; approval labels retained'}_`, '',
      ...Object.values(parts).filter(Boolean), '## Character rights', '', `License: ${c.rights.license}`, ...(c.rights.attribution ? ['', c.rights.attribution] : [])
    ].join('\n').trimEnd() + '\n';
    return { ...parts, markdown };
  }

  const STORAGE_KEY = 'persona-prompt-forge:workspace:1';
  const VAULT_KEY = 'persona-prompt-forge:vault:1';
  function createStore(storage) {
    return {
      read() { const text = storage.getItem(STORAGE_KEY); return text ? importDocument(text) : null; },
      write(doc) { storage.setItem(STORAGE_KEY, exportDocument(doc)); },
      list() {
        const parsed = JSON.parse(storage.getItem(VAULT_KEY) || '[]');
        if (!Array.isArray(parsed)) throw new Error('Local vault is unreadable.');
        return parsed;
      },
      save(name, doc, now = new Date().toISOString()) {
        const slots = this.list();
        const slot = { id: id(), name: name.trim() || 'Untitled sketch', savedAt: now, document: importDocument(exportDocument(doc)) };
        storage.setItem(VAULT_KEY, JSON.stringify([slot, ...slots])); return slot;
      },
      load(slotId) {
        const slot = this.list().find(item => item.id === slotId);
        if (!slot) throw new Error('Saved sketch was not found.');
        return importDocument(JSON.stringify(slot.document));
      },
      remove(slotId) { storage.setItem(VAULT_KEY, JSON.stringify(this.list().filter(item => item.id !== slotId))); }
    };
  }

  globalThis.PersonaForge = Object.freeze({
    FORMAT, VERSION, AXES, APPROVALS, ORIGINS, entry, clone, createDocument, validateDocument,
    importDocument, exportDocument, stableStringify, availableBank, randomize, undoRoll,
    banish, restoreBanished, replaceBank, enableModule, codify, createStore
  });
})();
