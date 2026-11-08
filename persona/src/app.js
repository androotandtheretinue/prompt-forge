/* Browser adapter. Character content never leaves this page. CC0-1.0. */
(() => {
  'use strict';
  const F = globalThis.PersonaForge;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  let doc = F.createDocument(), store, undo = [], bankKey = null, bankStarterRequested = false, toastTimer, saveTimer;
  try { store = F.createStore(window.localStorage); const saved = store.read(); if (saved) doc = saved; }
  catch (error) { storageFailure(error); }

  function status(message) {
    clearTimeout(toastTimer); $('#status').textContent = message; $('#status').hidden = false;
    toastTimer = setTimeout(() => { $('#status').hidden = true; }, 5000);
  }
  function storageFailure(error) {
    const label = $('#storage-status');
    label.textContent = 'Local save unavailable — export a backup'; label.classList.add('storage-error');
    label.title = error?.message || 'Browser storage is unavailable.';
  }
  function persist() {
    clearTimeout(saveTimer);
    try {
      if (!store) throw new Error('Browser storage is unavailable.');
      store.write(doc); $('#storage-status').textContent = 'Saved on this device';
      $('#storage-status').classList.remove('storage-error'); $('#storage-status').removeAttribute('title');
    } catch (error) { storageFailure(error); }
  }
  function changed() { renderPreview(); clearTimeout(saveTimer); saveTimer = setTimeout(persist, 200); }
  window.addEventListener('pagehide', persist);
  function pathValue(path) { return path.split('.').reduce((object, key) => object[key], doc.character); }
  function pathSet(path, value) {
    const keys = path.split('.'), last = keys.pop();
    const parent = keys.reduce((object, key) => object[key], doc.character); parent[last] = value;
  }
  function originLabel(value) {
    if (value.origin.kind === 'bank') return value.origin.reference?.startsWith('starter:') ? 'Starter bank' : 'Custom bank';
    return ({ unspecified: 'Unspecified', manual: 'Manual', 'ai-proposal': 'AI proposal', imported: 'Imported source' })[value.origin.kind];
  }
  function meta(path, label) {
    const value = pathValue(path);
    return `<div class="field-meta"><span class="field-origin" data-origin="${path}" title="${escape(value.origin.reference || '')}">${originLabel(value)}</span><select class="approval-select ${value.approval}" data-approval="${path}" aria-label="${escape(label)} approval status">${F.APPROVALS.map(state => `<option value="${state}" ${state === value.approval ? 'selected' : ''}>${state[0].toUpperCase() + state.slice(1)}</option>`).join('')}</select></div>`;
  }
  function field(path, label, { rows = 3, placeholder = '', input = false } = {}) {
    const value = pathValue(path), elementId = `field-${path.replaceAll('.', '-')}`;
    return `<div class="manual-field"><label for="${elementId}">${label}</label>${input
      ? `<input id="${elementId}" data-field="${path}" type="text" placeholder="${escape(placeholder)}" value="${escape(value.text)}">`
      : `<textarea id="${elementId}" data-field="${path}" rows="${rows}" placeholder="${escape(placeholder)}">${escape(value.text)}</textarea>`}${meta(path, label)}</div>`;
  }
  function updateMeta(path) {
    const value = pathValue(path);
    const origin = $(`[data-origin="${path}"]`), select = $(`[data-approval="${path}"]`);
    if (origin) { origin.textContent = originLabel(value); origin.title = value.origin.reference || ''; }
    if (select) { select.value = value.approval; select.className = `approval-select ${value.approval}`; }
  }
  const pinIcon = '<svg width="13" height="15" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="m5 2 7 3-2 3 1 4-4-1-3 5 1-6-3-2 4-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';

  function renderArchetypes() {
    const items = doc.character.kernel.archetypes;
    $('#archetype-stack').innerHTML = items.length ? items.map((item, index) => {
      const pinned = doc.forge.archetypeLocks[item.id], key = escape(item.id);
      return `<article class="archetype-card ${pinned ? 'pinned' : ''}" id="archetype-${key}"><div class="archetype-main">${field(`kernel.archetypes.${index}`, `Archetype ${index + 1}`, {input:true,placeholder:'Choose a fictional role, or invent one…'})}</div><div class="archetype-tools"><button class="icon-button" data-action="role-pin" data-key="${key}" aria-label="${pinned ? 'Unpin' : 'Pin'} archetype ${index + 1}" aria-pressed="${pinned}" title="${pinned ? 'Unpin' : 'Pin'} this archetype">${pinIcon}</button><button class="icon-button" data-action="role-reroll" data-key="${key}" aria-label="Reroll archetype ${index + 1}" title="Reroll this archetype" ${pinned ? 'disabled' : ''}>⚄</button><button class="icon-button" data-action="role-banish" data-key="${key}" aria-label="Banish archetype ${index + 1}" title="Banish this archetype from future rolls" ${item.text.trim() ? '' : 'disabled'}>⊘</button><button class="icon-button" data-action="role-remove" data-key="${key}" aria-label="Remove archetype ${index + 1}" title="Remove this archetype">✕</button></div></article>`;
    }).join('') : '<p class="empty-note">No archetypes selected. Add as many as the character needs, or leave the field empty.</p>';
  }

  function renderArchetypeBrowser() {
    const query = $('#archetype-search').value.trim().toLowerCase(), group = $('#archetype-group').value;
    const selected = new Set(doc.character.kernel.archetypes.map(item => item.text.trim().toLowerCase()));
    const available = F.availableBank(doc, 'archetype');
    const matches = available.filter(item => (!group || (item.group || 'Custom') === group) && (!query || `${item.text} ${item.group || 'Custom'}`.toLowerCase().includes(query))).sort((a,b) => a.text.localeCompare(b.text));
    $('#archetype-result-count').textContent = `${matches.length} ${matches.length === 1 ? 'archetype' : 'archetypes'} · mix across every family`;
    $('#archetype-selected-count').textContent = `${doc.character.kernel.archetypes.filter(item => item.text.trim()).length} selected`;
    $('#archetype-results').innerHTML = matches.length ? matches.map(item => `<button class="archetype-choice" data-action="choose-archetype" data-key="${escape(item.id)}" ${selected.has(item.text.trim().toLowerCase()) ? 'disabled' : ''}><strong>${escape(item.text)}</strong><small>${escape(item.group || 'Custom')}</small><span>${selected.has(item.text.trim().toLowerCase()) ? '✓ Added' : '+ Add'}</span></button>`).join('') : '<p class="empty-note">No matches. Try another search or family, edit the bank, or restore a banished signal.</p>';
  }

  function renderTraits() {
    $('#trait-board').innerHTML = F.AXES.map(({ key, label, hint }, i) => {
      const value = doc.character.kernel.traits[key], pinned = doc.forge.locks[key];
      return `<article class="trait-card ${pinned ? 'pinned' : ''}" id="trait-${key}"><div class="trait-top"><label for="trait-input-${key}"><span class="trait-number">${String(i + 1).padStart(2, '0')}</span>${label}</label><button class="icon-button" data-action="pin" data-key="${key}" aria-label="${pinned ? 'Unpin' : 'Pin'} ${label}" aria-pressed="${pinned}" title="${pinned ? 'Unpin' : 'Pin'} this trait, including a blank">${pinIcon}</button></div><p class="trait-hint">${hint}</p><textarea class="trait-input" id="trait-input-${key}" rows="2" data-field="kernel.traits.${key}" placeholder="Roll a signal, or write your own…">${escape(value.text)}</textarea><div class="trait-bottom">${meta(`kernel.traits.${key}`, label)}<div class="trait-actions"><button class="icon-button bank-picker" data-action="bank" data-key="${key}" aria-label="Edit ${label} bank" title="Edit descriptor bank">≡</button><button class="icon-button" data-action="banish" data-key="${key}" aria-label="Banish ${label} value" title="Banish this value from future rolls" ${value.text.trim() ? '' : 'disabled'}>⊘</button><button class="icon-button" data-action="reroll" data-key="${key}" aria-label="Reroll ${label}" title="Reroll this trait" ${pinned || !F.availableBank(doc, key).length ? 'disabled' : ''}>⚄</button></div></div></article>`;
    }).join('');
    renderArchetypes(); renderCounts();
  }
  function renderCounts() {
    const roles = doc.character.kernel.archetypes;
    $('#pinned-count').textContent = `${F.AXES.filter(({ key }) => doc.forge.locks[key]).length + roles.filter(item => doc.forge.archetypeLocks[item.id]).length} / ${F.AXES.length + roles.length} pinned`;
    const total = F.BANKS.reduce((n, { key }) => n + doc.forge.banks[key].length, 0);
    $('#bank-summary').textContent = `${total} signals · ${F.BANKS.length} editable banks`;
    const missing = F.BANKS.reduce((count, {key}) => { const current = new Set(doc.forge.banks[key].map(item => item.text.trim().toLowerCase())); return count + F.starterBank(key).filter(item => !current.has(item.text.trim().toLowerCase())).length; }, 0);
    $('#expand-starter-banks').hidden = !missing;
    $('#expand-starter-banks').textContent = `Add latest starter signals (+${missing})`;
    $('#banished-count').textContent = F.BANKS.reduce((n, { key }) => n + doc.forge.banished[key].length, 0);
    $('#undo').disabled = undo.length === 0;
    try { $('#vault-count').textContent = store?.list().length || 0; } catch (error) { storageFailure(error); }
  }
  function renderOptional(key) {
    const labels = { essence: 'essence enrichment', appearance: 'an appearance', continuity: 'continuity notes' };
    const value = doc.character[key], root = $(`#${key}-content`);
    if (value === null) {
      root.innerHTML = `<div class="add-module"><span class="overline">A LITTLE MORE, IF YOU WANT IT</span><p>This module is currently omitted from the character.</p><button class="button export" data-action="add-module" data-key="${key}">+ Add ${labels[key]}</button></div>`; return;
    }
    const fields = {
      essence: [['backstory', 'Backstory', 'The history that matters to this character.'], ['voiceNotes', 'Voice notes', 'Cadence, language, habits, and things they would never say.'], ['examples', 'Example dialogue', 'A few lines in their own voice.']],
      appearance: [['description', 'Appearance description', 'A form, a palette, a silhouette — or something less literal.']],
      continuity: [['notes', 'Continuity & memory notes', 'Context, sources, shared events, and open threads.']]
    };
    root.innerHTML = fields[key].map(([name, label, placeholder]) => field(`${key}.${name}`, label, { rows: key === 'essence' ? 4 : 8, placeholder })).join('') + `<button class="text-button" data-action="remove-module" data-key="${key}">Save a snapshot &amp; remove this module</button>`;
  }
  function renderCompanion() {
    const p = doc.character.companion;
    $('#relationship-enabled').checked = p.enabled; $('#companion-content').hidden = !p.enabled;
    document.querySelectorAll('[name="role"]').forEach(input => { input.checked = p.roles.includes(input.value); });
    for (const key of ['romance', 'erotic', 'changePolicy', 'approval']) $(`#relationship-${key}`).value = p[key];
    $('#relationship-fields').innerHTML = [
      ['customRoles', 'Custom roles', 'Your own role names, including any not listed above.'], ['dynamics', 'Relationship dynamics', 'How this relationship works.'],
      ['boundaries', 'Boundaries', 'Limits, permissions, and how a refusal is handled.'], ['expectations', 'Expectations', 'What each participant can expect.']
    ].map(([key, label, placeholder]) => field(`companion.${key}`, label, { rows: 3, placeholder })).join('');
    $('#configuration-origin').textContent = `Configuration origin: ${p.origin.kind}`;
  }
  function touchCompanion() {
    const p = doc.character.companion; p.origin = { kind: 'manual', reference: null }; p.approval = 'draft';
    $('#relationship-approval').value = p.approval; $('#configuration-origin').textContent = 'Configuration origin: manual';
  }
  function approvedCount(value) {
    if (!value || typeof value !== 'object') return 0;
    if (typeof value.text === 'string' && value.approval) return value.approval === 'approved' && value.text.trim() ? 1 : 0;
    return Object.values(value).reduce((n, child) => n + approvedCount(child), 0);
  }
  function renderPreview() {
    const c = doc.character, k = c.kernel, selected = F.AXES.filter(({ key }) => k.traits[key].text.trim());
    const roles = k.archetypes.filter(item => item.text.trim());
    $('#preview-name').textContent = k.name.text.trim() ? k.name.text : 'Someone unexpected.';
    $('#preview-pronouns').textContent = k.pronouns.text;
    $('#preview-premise').textContent = k.premise.text.trim() ? k.premise.text : selected.length ? 'A sketch in progress. Keep the signals that make you curious.' : 'A few signals can be a beginning. Forge a sketch, then make it yours.';
    $('#preview-stage').textContent = selected.length || roles.length || k.name.text ? 'A CHARACTER TAKING SHAPE' : 'UNWRITTEN POSSIBILITY';
    $('#preview-count').textContent = String(selected.length + roles.length).padStart(2, '0');
    const archetypes = $('#preview-archetypes'); archetypes.replaceChildren();
    for (const item of roles) {
      const tag = document.createElement('span'); tag.className = `archetype-tag ${item.approval}`;
      tag.textContent = item.text; tag.title = `Archetype · ${item.approval} · ${originLabel(item)}`; archetypes.append(tag);
    }
    const list = $('#preview-traits'); list.replaceChildren();
    if (!selected.length) { const p = document.createElement('p'); p.className = 'preview-empty'; p.textContent = 'Your selected personality signals will appear here.'; list.append(p); }
    for (const { key, label } of selected) {
      const item = k.traits[key], box = document.createElement('div'); box.className = 'preview-trait';
      const top = document.createElement('div'); top.className = 'preview-trait-label';
      const title = document.createElement('span'); title.textContent = label;
      const approval = document.createElement('span'); approval.textContent = item.approval; approval.className = item.approval;
      const p = document.createElement('p'); p.textContent = item.text; top.append(title, approval); box.append(top, p); list.append(box);
    }
    const modules = $('#preview-modules'); modules.replaceChildren();
    const append = (title, text) => {
      const box = document.createElement('div'); box.className = 'preview-module';
      const strong = document.createElement('strong'); strong.textContent = title;
      const detail = document.createElement('span'); detail.textContent = text; box.append(strong, detail); modules.append(box);
    };
    if (c.essence) append('ESSENCE ENRICHMENT', c.essence.backstory.text || c.essence.voiceNotes.text || 'Included · ready for your words');
    if (c.companion.enabled) append('COMPANION SIDECAR', `${c.companion.roles.join(' · ') || 'Roles unspecified'} · Romance: ${c.companion.romance} · Erotic: ${c.companion.erotic}`);
    if (c.appearance) append('APPEARANCE', c.appearance.description.text || 'Included · unspecified');
    if (c.continuity) append('CONTINUITY', c.continuity.notes.text || 'Included · no notes yet');
    const count = approvedCount(c); $('#approved-count').textContent = `${count} approved ${count === 1 ? 'entry' : 'entries'}`;
    if ($('#transfer-dialog').open) renderCodified();
  }
  function renderAll() {
    $('#name-field').innerHTML = field('kernel.name', 'Character name', { input: true, placeholder: 'What are they called?' });
    $('#pronouns-field').innerHTML = field('kernel.pronouns', 'Pronouns', { input: true, placeholder: 'Optional, in your own words' });
    $('#premise-field').innerHTML = field('kernel.premise', 'One-line premise', { rows: 2, placeholder: 'A seed for who they are, or the role they play…' });
    renderTraits(); ['essence', 'appearance', 'continuity'].forEach(renderOptional); renderCompanion();
    $('#rights-license').value = doc.character.rights.license; $('#rights-attribution').value = doc.character.rights.attribution;
    renderPreview();
  }
  function roll(keys) {
    const result = F.randomize(doc, keys); const changedKeys = Object.keys(result.changes);
    if (!changedKeys.length) { status('Nothing to roll. Unpin a trait or add an available descriptor.'); return; }
    doc = result.document; undo.push(result.changes); undo = undo.slice(-30); renderTraits(); changed();
    changedKeys.forEach(key => {
      const selector = key.startsWith('archetype:') ? `#${CSS.escape(`archetype-${key.slice(10)}`)}` : `#trait-${key}`;
      $(selector)?.classList.add('roll-flash');
    });
    status(`${changedKeys.length} ${changedKeys.length === 1 ? 'new signal' : 'new signals'} · suggestions until you approve them${result.skipped.length ? ` · ${result.skipped.length} unchanged (no alternative)` : ''}.`);
  }
  function openDialog(selector) { const dialog = $(selector); if (!dialog.open) dialog.showModal(); }
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));

  function renderBans(container, keys) {
    container.replaceChildren();
    let count = 0;
    for (const key of keys) for (const text of doc.forge.banished[key]) {
      count++;
      const item = document.createElement('div'); item.className = 'ban-item';
      const label = document.createElement('span'); const axis = document.createElement('small'); axis.textContent = F.BANKS.find(a => a.key === key).label;
      const value = document.createElement('span'); value.textContent = text; label.append(axis, value);
      const restore = document.createElement('button'); restore.className = 'text-button'; restore.textContent = 'Restore'; restore.setAttribute('aria-label', `Restore ${text}`);
      restore.addEventListener('click', () => {
        doc = F.restoreBanished(doc, key, text); renderTraits(); renderBans(container, keys); changed(); status('Signal restored to future rolls.');
      }); item.append(label, restore); container.append(item);
    }
    if (!count) { const p = document.createElement('p'); p.className = 'empty-note'; p.textContent = 'No banished signals here.'; container.append(p); }
  }
  function snapshot(name) {
    if (!store) throw new Error('Local storage is unavailable. Export JSON to keep this sketch.');
    const slot = store.save(name, doc); renderCounts(); return slot;
  }

  document.addEventListener('input', event => {
    const path = event.target.dataset.field;
    if (!path) return;
    pathSet(path, { ...pathValue(path), text: event.target.value, origin: { kind: 'manual', reference: null }, approval: 'draft' });
    updateMeta(path);
    if (path.startsWith('kernel.traits.')) {
      const key = path.split('.').at(-1); $(`[data-action="banish"][data-key="${key}"]`).disabled = !event.target.value.trim();
    }
    if (path.startsWith('kernel.archetypes.')) {
      const item = pathValue(path); $(`[data-action="role-banish"][data-key="${CSS.escape(item.id)}"]`).disabled = !item.text.trim();
    }
    changed();
  });
  document.addEventListener('change', event => {
    const path = event.target.dataset.approval;
    if (!path) return;
    pathValue(path).approval = event.target.value; updateMeta(path); changed();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const { action, key } = button.dataset;
    if (action === 'pin') { doc.forge.locks[key] = !doc.forge.locks[key]; renderTraits(); changed(); $(`[data-action="pin"][data-key="${key}"]`).focus(); }
    if (action === 'reroll') { roll([key]); $(`[data-action="reroll"][data-key="${key}"]`).focus(); }
    if (action === 'bank') {
      bankKey = key; bankStarterRequested = false; $('#bank-title').textContent = F.BANKS.find(a => a.key === key).label;
      $('#bank-text').value = doc.forge.banks[key].map(item => item.text).join('\n');
      renderBans($('#bank-bans'), [key]); openDialog('#bank-dialog');
    }
    if (action === 'banish') {
      const text = doc.character.kernel.traits[key].text; doc = F.banish(doc, key, text);
      if (!doc.forge.locks[key]) roll([key]); else { renderTraits(); changed(); }
      renderCounts(); changed(); status(doc.forge.locks[key] ? 'Banished from future rolls. The pinned value is kept.' : 'Banished from future rolls. Restore it in Banished signals.');
      $(`[data-action="banish"][data-key="${key}"]`).focus();
    }
    if (action === 'choose-archetype') {
      doc = F.selectArchetype(doc, key); renderArchetypes(); renderCounts(); renderArchetypeBrowser(); changed(); $('#archetype-search').focus(); status('Archetype added. Keep browsing to combine more roles.');
    }
    if (action === 'role-pin') {
      doc.forge.archetypeLocks[key] = !doc.forge.archetypeLocks[key]; renderArchetypes(); renderCounts(); changed();
      $(`[data-action="role-pin"][data-key="${CSS.escape(key)}"]`).focus();
    }
    if (action === 'role-reroll') { roll([`archetype:${key}`]); $(`[data-action="role-reroll"][data-key="${CSS.escape(key)}"]`).focus(); }
    if (action === 'role-remove') { doc = F.removeArchetype(doc, key); renderArchetypes(); renderCounts(); changed(); status('Archetype removed. Other character data is kept.'); $('#add-archetype').focus(); }
    if (action === 'role-banish') {
      const item = doc.character.kernel.archetypes.find(item => item.id === key);
      doc = F.banish(doc, 'archetype', item.text);
      if (!doc.forge.archetypeLocks[key]) roll([`archetype:${key}`]);
      renderArchetypes(); renderCounts(); changed(); status(doc.forge.archetypeLocks[key] ? 'Archetype banished from future rolls. The pinned value is kept.' : 'Archetype banished from future rolls.');
    }
    if (action === 'add-module') { doc = F.enableModule(doc, key, true); renderOptional(key); changed(); }
    if (action === 'remove-module') {
      try { snapshot(`Before removing ${key}`); doc.character[key] = null; renderOptional(key); changed(); status('Module removed. A snapshot keeps the previous version.'); }
      catch (error) { storageFailure(error); status(error.message); }
    }
  });
  $('#roll-all').addEventListener('click', () => roll());
  $('#undo').addEventListener('click', () => {
    const changes = undo.pop(); if (!changes) return;
    const result = F.undoRoll(doc, changes); doc = result.document; renderTraits(); changed();
    status(`Restored ${result.restored.length} ${result.restored.length === 1 ? 'trait' : 'traits'}${result.preserved.length ? `; kept ${result.preserved.length} later edits or approvals` : ''}.`);
  });
  $('#unlock-all').addEventListener('click', () => { F.AXES.forEach(({ key }) => { doc.forge.locks[key] = false; }); Object.keys(doc.forge.archetypeLocks).forEach(key => { doc.forge.archetypeLocks[key] = false; }); renderTraits(); changed(); status('All personality signals and archetypes unpinned.'); });
  $('#add-archetype').addEventListener('click', () => { doc = F.addArchetype(doc); renderArchetypes(); renderCounts(); changed(); $(`[data-field="kernel.archetypes.${doc.character.kernel.archetypes.length - 1}"]`).focus(); });
  $('#roll-archetypes').addEventListener('click', () => {
    if (!doc.character.kernel.archetypes.length) { doc = F.addArchetype(F.addArchetype(doc)); renderArchetypes(); renderCounts(); changed(); }
    roll(['archetypes']);
  });
  $('#browse-archetypes').addEventListener('click', () => {
    const groups = [...new Set(doc.forge.banks.archetype.map(item => item.group || 'Custom'))];
    $('#archetype-group').innerHTML = '<option value="">All families</option>' + groups.map(group => `<option value="${escape(group)}">${escape(group)}</option>`).join('');
    renderArchetypeBrowser(); openDialog('#archetype-dialog'); $('#archetype-search').focus();
  });
  $('#archetype-search').addEventListener('input', renderArchetypeBrowser);
  $('#archetype-group').addEventListener('change', renderArchetypeBrowser);
  $('#add-starter-signals').addEventListener('click', () => {
    const lines = $('#bank-text').value.split(/\r?\n/), present = new Set(lines.map(text => text.trim().toLowerCase()));
    const added = F.starterBank(bankKey).filter(item => !present.has(item.text.trim().toLowerCase()));
    $('#bank-text').value = [...lines.filter(text => text.trim()), ...added.map(item => item.text)].join('\n');
    bankStarterRequested = true; status(`${added.length} starter signals added to the list. Save the bank to apply them.`);
  });
  $('#expand-starter-banks').addEventListener('click', () => { const result = F.addMissingStarters(doc); doc = result.document; renderTraits(); changed(); status(`${result.added} starter signals added. Custom signals, banishments, and selected character text are kept.`); });
  $('#save-bank').addEventListener('click', () => {
    doc = F.replaceBank(doc, bankKey, $('#bank-text').value, {includeStarters:bankStarterRequested}); renderTraits(); changed(); $('#bank-dialog').close(); status('Descriptor bank saved. Your selected character text is kept.');
  });
  $('#open-banished').addEventListener('click', () => { renderBans($('#banished-list'), F.BANKS.map(a => a.key)); openDialog('#banished-dialog'); });

  const tabs = [...document.querySelectorAll('[data-tab]')];
  function selectTab(button, focus = false) {
    for (const tab of tabs) { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active); tab.tabIndex = active ? 0 : -1; $(`#panel-${tab.dataset.tab}`).hidden = !active; }
    if (focus) button.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (i + 1) % tabs.length : event.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (target !== null) { event.preventDefault(); selectTab(tabs[target], true); }
    });
  });
  $('#relationship-enabled').addEventListener('change', event => {
    doc.character.companion.enabled = event.target.checked; touchCompanion(); $('#companion-content').hidden = !event.target.checked; changed();
  });
  document.querySelectorAll('[name="role"]').forEach(input => input.addEventListener('change', () => {
    // Preserve custom role strings supplied by a valid import, even if no checkbox represents them.
    const known = [...document.querySelectorAll('[name="role"]')].map(item => item.value);
    const unknown = doc.character.companion.roles.filter(role => !known.includes(role));
    doc.character.companion.roles = [...unknown, ...[...document.querySelectorAll('[name="role"]:checked')].map(item => item.value)]; touchCompanion(); changed();
  }));
  for (const key of ['romance', 'erotic', 'changePolicy']) $(`#relationship-${key}`).addEventListener('change', event => { doc.character.companion[key] = event.target.value; touchCompanion(); changed(); });
  $('#relationship-approval').addEventListener('change', event => { doc.character.companion.approval = event.target.value; changed(); });
  for (const key of ['license', 'attribution']) $(`#rights-${key}`).addEventListener('input', event => { doc.character.rights[key] = event.target.value; changed(); });

  function renderVault() {
    const list = $('#vault-list'); list.replaceChildren();
    let slots;
    try { slots = store?.list() || []; } catch (error) { storageFailure(error); status(error.message); return; }
    if (!slots.length) { list.innerHTML = '<p class="empty-note">Nothing saved yet. Keep a version worth returning to.</p>'; return; }
    for (const slot of slots) {
      const box = document.createElement('div'); box.className = 'vault-item'; const text = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = slot.name;
      const time = document.createElement('small'); time.textContent = new Date(slot.savedAt).toLocaleString(); text.append(name, time);
      const actions = document.createElement('div'); actions.className = 'vault-actions';
      const load = document.createElement('button'); load.className = 'button export'; load.textContent = 'Load'; load.setAttribute('aria-label', `Load ${slot.name}`);
      load.addEventListener('click', () => {
        try {
          const loaded = store.load(slot.id); snapshot('Before loading a saved sketch');
          doc = loaded; undo = []; renderAll(); persist(); $('#vault-dialog').close(); status(`Loaded ${slot.name}. Previous workspace kept as a snapshot.`);
        } catch (error) { status(error.message); }
      });
      const remove = document.createElement('button'); remove.className = 'icon-button'; remove.textContent = '✕'; remove.setAttribute('aria-label', `Delete saved sketch ${slot.name}`);
      remove.addEventListener('click', () => { try { store.remove(slot.id); renderVault(); renderCounts(); status('Saved snapshot deleted. The current workspace is unchanged.'); } catch (error) { storageFailure(error); status(error.message); } });
      actions.append(load, remove); box.append(text, actions); list.append(box);
    }
  }
  $('#open-vault').addEventListener('click', () => { $('#sketch-name').value = doc.character.kernel.name.text; renderVault(); openDialog('#vault-dialog'); });
  $('#save-sketch').addEventListener('click', () => { try { snapshot($('#sketch-name').value); renderVault(); status('Snapshot saved on this device.'); } catch (error) { storageFailure(error); status(error.message); } });

  let downloadUrls = [];
  function renderCodified() {
    const parts = F.codify(doc, { approvedOnly: $('#approved-only').checked });
    const json = F.exportDocument(doc);
    $('#codified-output').value = parts.markdown;
    $('#canonical-output').value = json;
    const oldUrls = downloadUrls; downloadUrls = [];
    // Native download links keep the user's click attached to the download.
    // Revoke old links after pending browser downloads have had time to start.
    setTimeout(() => oldUrls.forEach(url => URL.revokeObjectURL(url)), 1000);
    for (const [selector, text, type, name] of [
      ['#download-json', json, 'application/json', filename('json')],
      ['#download-markdown', parts.markdown, 'text/markdown;charset=utf-8', filename('md')],
      ['#download-companion', parts.companion, 'text/markdown;charset=utf-8', filename('md', '-companion')]
    ]) {
      const link = $(selector); link.setAttribute('aria-disabled', String(text === null));
      if (text === null) { link.removeAttribute('href'); link.tabIndex = -1; continue; }
      const url = URL.createObjectURL(new Blob([text], { type })); downloadUrls.push(url);
      link.href = url; link.download = name; link.tabIndex = 0;
    }
  }
  $('#open-transfer').addEventListener('click', () => { renderCodified(); $('#import-error').hidden = true; openDialog('#transfer-dialog'); });
  $('#approved-only').addEventListener('change', renderCodified);
  function filename(extension, suffix = '') { return `${(doc.character.kernel.name.text || 'persona').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'persona'}${suffix}.${extension}`; }
  for (const selector of ['#download-json', '#download-markdown', '#download-companion']) $(selector).addEventListener('click', event => {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  $('#copy-markdown').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#codified-output').value); status('Markdown copied.'); }
    catch { $('#codified-output').focus(); $('#codified-output').select(); status('Copy access is unavailable. The document is selected for manual copying.'); }
  });
  $('#copy-json').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#canonical-output').value); status('Canonical JSON copied.'); }
    catch { $('#canonical-section').open = true; $('#canonical-output').focus(); $('#canonical-output').select(); status('JSON selected for manual copying.'); }
  });
  $('#import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 2_000_000) { $('#import-error').textContent = 'Choose a JSON file under 2 MB.'; $('#import-error').hidden = false; return; }
    try { $('#import-text').value = await file.text(); $('#import-error').hidden = true; } catch { $('#import-error').textContent = 'The file could not be read.'; $('#import-error').hidden = false; }
  });
  $('#import-json').addEventListener('click', () => {
    try {
      const imported = F.importDocument($('#import-text').value); // Validate entirely before replacing state.
      doc = imported; undo = []; renderAll(); persist(); renderCodified(); $('#import-error').hidden = true;
      $('#import-text').value = ''; $('#import-file').value = ''; status('Character imported. Text, origin, approvals, banks, pins, and banishments preserved.');
    } catch (error) { $('#import-error').textContent = `${error.message}\nNothing changed.`; $('#import-error').hidden = false; }
  });
  $('#new-character').addEventListener('click', () => openDialog('#new-dialog'));
  $('#confirm-new').addEventListener('click', () => {
    try { snapshot(doc.character.kernel.name.text || 'Before new character'); doc = F.createDocument(); undo = []; renderAll(); persist(); selectTab(tabs[0]); $('#new-dialog').close(); status('Fresh character ready. Your previous sketch is saved.'); }
    catch (error) { storageFailure(error); status(error.message); }
  });
  document.addEventListener('keydown', event => {
    if (event.altKey && event.key.toLowerCase() === 'r' && !document.querySelector('dialog[open]')) { event.preventDefault(); roll(); }
  });
  renderAll();
})();
