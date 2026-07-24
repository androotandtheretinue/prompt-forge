/* Prompt Forge DARPA v5
 * Drop-in extension for the existing single-page v4 index.html.
 * Adds:
 * - crypto-backed centralized randomness with no immediate repeats
 * - random drag-strum; Shift+drag step-strum
 * - Clear Unlocked preserving locked values and locked blanks
 * - persistent custom entries for every category pool
 * - custom entries in randomization, strum, Option Radar, and Blueprints
 * - DARPA Forge Card and supporting vocabulary
 */
(() => {
  'use strict';

  const PF_VERSION = '5.1';
  const CUSTOM_STORAGE_KEY = 'promptForgeCustomOptionsV1';

  const customOptions = Object.fromEntries(
    Object.keys(categories).map((key) => [key, []])
  );

  let customEditorKey = null;
  let strumActive = false;
  let strumPointerId = null;
  let strumMode = 'random';
  let lastStrumKey = null;
  let lastStrumX = null;
  let lastStrumY = null;
  const SAME_ROW_STRUM_DISTANCE = 24;

  const darpaVocabulary = {
    medium: [
      'Vector Graphics',
      'Oscilloscope Display Capture'
    ],
    action: [
      'Monitoring Telemetry',
      'Scanning for Anomalies'
    ],
    texture: [
      'DARPA Scan Lines',
      'CRT Raster',
      'Phosphor Bloom'
    ],
    style: [
      'DARPA Interface',
      'Retro Tactical Futurism',
      'Defense Terminal Aesthetic'
    ],
    lighting: [
      'Phosphor Monitor Glow',
      'Amber CRT Glow'
    ],
    framing: [
      'Command Console View',
      'Tactical Display Close-Up'
    ],
    mood: [
      'Cold War Paranoia',
      'Command-Line Authority',
      'Clinical Surveillance'
    ],
    palette: [
      'Phosphor Green',
      'Terminal Amber',
      'Blue-White Terminal'
    ],
    quality: [
      'Archive Display Fidelity',
      'Declassified Technical Capture'
    ],
    setting: [
      'Defense Research Operations Center',
      'Retro Command Terminal',
      'Military Computing Lab'
    ],
    weather: [
      'Static-Charged Interior Air'
    ],
    wardrobe: [
      'Systems Operator Utility Wear'
    ],
    fx: [
      'Telemetry Overlay',
      'Vector Wireframe Grid',
      'Targeting Reticle',
      'Data Box HUD',
      'Oscilloscope Trace'
    ],
    composition: [
      'HUD-Dominant Overlay',
      'Command Screen Layout',
      'Tactical Grid Composition'
    ],
    colorlogic: [
      'Monochrome Authority Signal',
      'Phosphor Signal Hierarchy'
    ],
    narrative: [
      'The Interface Knows Before You Do',
      'The Signal Was Classified for a Reason'
    ]
  };

  // ------------------------------------------------------------
  // RANDOMNESS
  // ------------------------------------------------------------

  function secureUint32() {
    if (globalThis.crypto?.getRandomValues) {
      return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 4294967296);
  }

  function randInt(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;

    // Rejection sampling avoids modulo bias.
    const ceiling = 4294967296;
    const limit = Math.floor(ceiling / max) * max;
    let value;

    do {
      value = secureUint32();
    } while (value >= limit);

    return value % max;
  }

  function shuffle(items) {
    const output = [...items];

    for (let index = output.length - 1; index > 0; index -= 1) {
      const swapIndex = randInt(index + 1);
      [output[index], output[swapIndex]] = [
        output[swapIndex],
        output[index]
      ];
    }

    return output;
  }

  function getBuiltInOptions(key) {
    const category = categories[key];

    if (!category) return [];

    return category.options.filter(
      (option) => option && !option.startsWith('—')
    );
  }

  function uniqueCaseInsensitive(items) {
    const seen = new Set();

    return items.filter((item) => {
      const normalized = String(item).trim().toLocaleLowerCase();

      if (!normalized || seen.has(normalized)) return false;

      seen.add(normalized);
      return true;
    });
  }

  function getCombinedOptions(key) {
    return uniqueCaseInsensitive([
      ...getBuiltInOptions(key),
      ...(customOptions[key] || [])
    ]);
  }

  function setSelectValue(key) {
    const select = document.getElementById(`select-${key}`);

    if (select) select.value = categories[key].value;
  }

  function animateRow(key) {
    const row = document.getElementById(`row-${key}`);

    if (!row) return;

    row.classList.remove('shake');
    void row.offsetWidth;
    row.classList.add('shake');

    setTimeout(() => row.classList.remove('shake'), 300);
  }

  // Replace the v4 picker so every random action uses the same source.
  pickRandomOption = function pickRandomOptionV5(key, animate = true) {
    const category = categories[key];

    if (!category || category.locked) return false;

    const pool = getCombinedOptions(key);

    if (!pool.length) return false;

    // A reroll should normally produce a visible change.
    const candidates =
      pool.length > 1
        ? pool.filter((option) => option !== category.value)
        : pool;

    category.value = candidates[randInt(candidates.length)];
    setSelectValue(key);

    if (animate) animateRow(key);

    return true;
  };

  randomizeSeed = function randomizeSeedV5() {
    const seed = secureUint32().toString();

    mjControls.seed = seed;
    document.getElementById('mjSeed').value = seed;
    updatePreview();
  };

  rollChaosModifier = function rollChaosModifierV5() {
    let pool = [];

    if (chaosLevel > 0 && chaosLevel <= 33) {
      pool = chaosModifiers.low;
    } else if (chaosLevel <= 66 && chaosLevel > 0) {
      pool = chaosModifiers.medium;
    } else if (chaosLevel > 66) {
      pool = chaosModifiers.high;
    }

    const candidates =
      pool.length > 1
        ? pool.filter((value) => value !== pinnedChaosModifier)
        : pool;

    pinnedChaosModifier = candidates.length
      ? candidates[randInt(candidates.length)]
      : '';

    const row = document.getElementById('chaosPinnedRow');
    const text = document.getElementById('chaosPinnedText');

    row.style.display = pinnedChaosModifier ? 'flex' : 'none';
    text.textContent = pinnedChaosModifier;
  };

  randomizeAll = function randomizeAllV5() {
    const unlocked = Object.keys(categories).filter(
      (key) => !categories[key].locked
    );

    const shuffled = shuffle(unlocked);
    const target =
      payloadDensity === 'recon'
        ? 6
        : payloadDensity === 'standard'
          ? 10
          : unlocked.length;

    const selected = new Set(
      shuffled.slice(0, Math.min(target, shuffled.length))
    );

    if (payloadDensity !== 'full') {
      unlocked.forEach((key) => {
        if (!selected.has(key)) {
          categories[key].value = '';
          setSelectValue(key);
        }
      });
    }

    selected.forEach((key) => pickRandomOption(key));
    rollChaosModifier();
    updatePreview();
  };

  mutateRandom = function mutateRandomV5(count = 3) {
    const unlocked = Object.keys(categories).filter(
      (key) => !categories[key].locked
    );

    shuffle(unlocked)
      .slice(0, count)
      .forEach((key) => pickRandomOption(key));

    updatePreview();
  };

  // ------------------------------------------------------------
  // STRUM
  // ------------------------------------------------------------

  function stepCategory(key, direction = 1) {
    const category = categories[key];

    if (!category || category.locked) return false;

    const pool = getCombinedOptions(key);

    if (!pool.length) return false;

    const currentIndex = pool.indexOf(category.value);
    const nextIndex =
      currentIndex < 0
        ? direction > 0
          ? 0
          : pool.length - 1
        : (currentIndex + direction + pool.length) % pool.length;

    category.value = pool[nextIndex];
    setSelectValue(key);
    animateRow(key);

    return true;
  }

  function strumRow(row, event) {
    const key = row?.dataset?.categoryKey;

    if (!key || !categories[key] || categories[key].locked) {
      return;
    }

    const sameRow = key === lastStrumKey;

    if (
      sameRow &&
      event &&
      lastStrumX != null &&
      lastStrumY != null
    ) {
      const dx = event.clientX - lastStrumX;
      const dy = event.clientY - lastStrumY;
      const distance = Math.hypot(dx, dy);

      if (distance < SAME_ROW_STRUM_DISTANCE) {
        return;
      }
    }

    if (strumMode === 'step') {
      stepCategory(key, 1);
    } else {
      pickRandomOption(key);
    }

    lastStrumKey = key;
    lastStrumX = event?.clientX ?? null;
    lastStrumY = event?.clientY ?? null;

    updatePreview();
  }

  function beginStrum(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (event.target.closest('button, select, input, textarea, a')) return;

    const row = event.target.closest('.category-row');

    if (!row) return;

    strumActive = true;
    strumPointerId = event.pointerId;
    strumMode = event.shiftKey ? 'step' : 'random';
    lastStrumKey = null;
    lastStrumX = null;
    lastStrumY = null;

    document.body.classList.add('strumming');
    event.currentTarget.setPointerCapture?.(event.pointerId);

    strumRow(row, event);
    event.preventDefault();
  }

  function moveStrum(event) {
    if (!strumActive || event.pointerId !== strumPointerId) return;

    const row = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('.category-row');

    if (row) strumRow(row, event);
  }

  function endStrum(event) {
    if (
      !strumActive ||
      (event.pointerId != null && event.pointerId !== strumPointerId)
    ) {
      return;
    }

    strumActive = false;
    strumPointerId = null;
    lastStrumKey = null;
    lastStrumX = null;
    lastStrumY = null;
    document.body.classList.remove('strumming');
  }

  // ------------------------------------------------------------
  // CLEAR UNLOCKED
  // ------------------------------------------------------------

  function clearUnlocked() {
    if (!subjectLocked) {
      document.getElementById('subjectInput').value = '';
    }

    Object.entries(categories).forEach(([key, category]) => {
      if (!category.locked) {
        category.value = '';
        setSelectValue(key);
      }
    });

    updatePreview();
  }

  // ------------------------------------------------------------
  // CUSTOM POOLS
  // ------------------------------------------------------------

  function loadCustomOptions() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CUSTOM_STORAGE_KEY) || '{}'
      );

      Object.keys(customOptions).forEach((key) => {
        if (!Array.isArray(saved[key])) return;

        const builtInLower = new Set(
          getBuiltInOptions(key).map((value) =>
            value.toLocaleLowerCase()
          )
        );

        customOptions[key] = uniqueCaseInsensitive(
          saved[key].map(String).map((value) => value.trim())
        ).filter(
          (value) => !builtInLower.has(value.toLocaleLowerCase())
        );
      });
    } catch (error) {
      console.warn('Custom pools could not be restored:', error);
    }
  }

  function persistCustomOptions() {
    try {
      localStorage.setItem(
        CUSTOM_STORAGE_KEY,
        JSON.stringify(customOptions)
      );
    } catch (error) {
      console.warn('Custom pools could not be saved:', error);
    }
  }

  function renderCustomEditor() {
    const modal = document.getElementById('customPoolModal');
    const category = categories[customEditorKey];

    if (!modal || !category) return;

    document.getElementById('customPoolTitle').textContent =
      `${category.icon} ${category.label} CUSTOM SIGNALS`;

    const list = document.getElementById('customPoolList');
    const entries = customOptions[customEditorKey] || [];

    list.innerHTML = entries.length
      ? entries
          .map(
            (entry, index) => `
              <div class="custom-entry-row">
                <span>${escapeHtml(entry)}</span>
                <button
                  class="btn btn-clear"
                  onclick="removeCustomOption(${index})"
                  title="Remove custom signal"
                >✕</button>
              </div>
            `
          )
          .join('')
      : '<span class="text-gray-600 italic text-sm">No custom signals in this pool yet.</span>';
  }

  window.openCustomPool = function openCustomPool(key) {
    if (!categories[key]) return;

    customEditorKey = key;
    renderCustomEditor();

    document
      .getElementById('customPoolModal')
      .classList.remove('hidden');

    setTimeout(
      () => document.getElementById('customPoolInput')?.focus(),
      0
    );
  };

  window.closeCustomPool = function closeCustomPool() {
    document
      .getElementById('customPoolModal')
      ?.classList.add('hidden');

    customEditorKey = null;
  };

  window.addCustomOption = function addCustomOption() {
    if (!customEditorKey) return;

    const input = document.getElementById('customPoolInput');
    const value = input.value.trim();

    if (!value) return;

    const allLower = new Set(
      getCombinedOptions(customEditorKey).map((item) =>
        item.toLocaleLowerCase()
      )
    );

    if (allLower.has(value.toLocaleLowerCase())) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 300);
      return;
    }

    customOptions[customEditorKey].push(value);
    categories[customEditorKey].value = value;
    input.value = '';

    persistCustomOptions();
    renderCategories();
    renderCustomEditor();
    updateOptionCount();
    updatePreview();
  };

  window.removeCustomOption = function removeCustomOption(index) {
    if (
      !customEditorKey ||
      !customOptions[customEditorKey]?.[index]
    ) {
      return;
    }

    const removed = customOptions[customEditorKey][index];

    customOptions[customEditorKey].splice(index, 1);

    if (categories[customEditorKey].value === removed) {
      categories[customEditorKey].value = '';
    }

    persistCustomOptions();
    renderCategories();
    renderCustomEditor();
    updateOptionCount();
    updatePreview();
  };

  // Include custom pool definitions in newly saved Blueprints.
  const originalCaptureConfiguration = captureConfiguration;

  captureConfiguration = function captureConfigurationV5() {
    return {
      ...originalCaptureConfiguration(),
      customOptions: JSON.parse(JSON.stringify(customOptions))
    };
  };

  const originalApplyConfiguration = applyConfiguration;

  applyConfiguration = function applyConfigurationV5(
    config,
    refresh = true
  ) {
    if (config?.customOptions) {
      Object.keys(customOptions).forEach((key) => {
        if (Array.isArray(config.customOptions[key])) {
          customOptions[key] = uniqueCaseInsensitive(
            config.customOptions[key]
              .map(String)
              .map((value) => value.trim())
          );
        }
      });

      persistCustomOptions();
    }

    /*
     * The original v4 loader validates selections against category.options.
     * Temporarily expose custom entries during validation, then restore the
     * canonical built-in array.
     */
    const originalArrays = {};

    Object.keys(categories).forEach((key) => {
      originalArrays[key] = categories[key].options;
      categories[key].options = [
        ...categories[key].options,
        ...(customOptions[key] || [])
      ];
    });

    try {
      originalApplyConfiguration(config, refresh);
    } finally {
      Object.keys(categories).forEach((key) => {
        categories[key].options = originalArrays[key];
      });
    }

    if (refresh) {
      renderCategories();
      updateOptionCount();
      updatePreview();
    }
  };

  // ------------------------------------------------------------
  // OPTION RADAR WITH CUSTOM ENTRIES
  // ------------------------------------------------------------

  renderRadarResults = function renderRadarResultsV5() {
    const query = document
      .getElementById('radarInput')
      .value.trim()
      .toLocaleLowerCase();

    const box = document.getElementById('radarResults');

    if (query.length < 2) {
      box.innerHTML = '';
      return;
    }

    const matches = [];

    Object.entries(categories).forEach(([key, category]) => {
      getCombinedOptions(key).forEach((option) => {
        if (option.toLocaleLowerCase().includes(query)) {
          matches.push({ key, category, option });
        }
      });
    });

    box.innerHTML = matches
      .slice(0, 48)
      .map(
        ({ key, category, option }, index) => `
          <button
            class="radar-result"
            data-radar-index="${index}"
          >
            <span>${category.icon}</span>
            <span class="flex-1">${escapeHtml(option)}</span>
            <span class="text-gray-600">${escapeHtml(category.label)}</span>
          </button>
        `
      )
      .join('');

    box.querySelectorAll('[data-radar-index]').forEach((button) => {
      button.addEventListener('click', () => {
        const match = matches[Number(button.dataset.radarIndex)];
        const category = categories[match.key];

        if (!category || category.locked) return;

        category.value = match.option;
        setSelectValue(match.key);
        animateRow(match.key);
        updatePreview();
      });
    });

    if (!matches.length) {
      box.innerHTML =
        '<span class="text-gray-600 italic text-sm">No signal acquired.</span>';
    }

    if (matches.length > 48) {
      box.insertAdjacentHTML(
        'beforeend',
        `<span class="text-xs text-gray-600">+ ${matches.length - 48} more matches; narrow the signal.</span>`
      );
    }
  };

  // ------------------------------------------------------------
  // DARPA CARD + VOCABULARY
  // ------------------------------------------------------------

  function ensureBuiltInOption(key, option) {
    const category = categories[key];

    if (
      !category ||
      category.options.some(
        (existing) =>
          existing.toLocaleLowerCase() === option.toLocaleLowerCase()
      )
    ) {
      return;
    }

    category.options.push(option);
  }

  function installDarpaCard() {
    Object.entries(darpaVocabulary).forEach(([key, options]) => {
      options.forEach((option) => ensureBuiltInOption(key, option));
    });

    presets.DARPA = {
      medium: 'Vector Graphics',
      texture: 'DARPA Scan Lines',
      style: 'DARPA Interface',
      lighting: 'Phosphor Monitor Glow',
      framing: 'Command Console View',
      mood: 'Cold War Paranoia',
      palette: 'Phosphor Green',
      quality: 'Archive Display Fidelity',
      fx: 'Telemetry Overlay',
      composition: 'HUD-Dominant Overlay',
      colorlogic: 'Monochrome Authority Signal',
      narrative: 'The Interface Knows Before You Do'
    };

    presetMeta.DARPA = [
      '📟',
      'Cold-war terminal authority, phosphor raster, and classified telemetry.',
      '#73ff75'
    ];
  }

  // ------------------------------------------------------------
  // V5 RENDERING
  // ------------------------------------------------------------

  updateOptionCount = function updateOptionCountV5() {
    const total = Object.keys(categories).reduce(
      (sum, key) => sum + getCombinedOptions(key).length,
      0
    );

    document.getElementById('optionCountHeader').textContent =
      `AI Image Generation Control Board · DARPA v${PF_VERSION} · ` +
      `${total.toLocaleString()} Options · ` +
      `${Object.keys(categories).length} Axes`;
  };

  renderCategories = function renderCategoriesV5() {
    const panel = document.getElementById('categoriesPanel');

    panel.innerHTML = '';

    Object.entries(categories).forEach(([key, category]) => {
      const builtIns = getBuiltInOptions(key);
      const customs = customOptions[key] || [];
      const signalCount = getCombinedOptions(key).length;

      const row = document.createElement('div');

      row.id = `row-${key}`;
      row.dataset.categoryKey = key;
      row.className =
        'category-row p-4 flex flex-col md:flex-row md:items-center ' +
        'gap-3 border-b border-gray-800 last:border-b-0 ' +
        `${category.locked ? 'locked' : ''}`;

      row.title =
        'Drag across row labels to random-strum. ' +
        'Hold Shift while dragging to step forward.';

      row.innerHTML = `
        <div class="flex items-center gap-3 md:w-44 strum-zone">
          <div
            class="status-dot ${category.locked ? '' : 'pulse'}"
            id="dot-${key}"
          ></div>
          <span class="category-label" id="label-${key}">
            ${category.icon} ${category.label}
            <span class="block text-gray-600" style="font-size:9px;">
              ${signalCount} SIGNALS · STRUM ⇅
            </span>
          </span>
        </div>

        <div class="flex-1">
          <select
            id="select-${key}"
            class="w-full"
            onchange="handleSelect('${key}', this.value)"
            ${category.locked ? 'disabled' : ''}
          >
            <option value="">— Select ${escapeHtml(category.label)} —</option>

            ${builtIns
              .map(
                (option) =>
                  `<option value="${escapeAttribute(option)}" ` +
                  `${category.value === option ? 'selected' : ''}>` +
                  `${escapeHtml(option)}</option>`
              )
              .join('')}

            ${
              customs.length
                ? `<optgroup label="CUSTOM SIGNALS">
                    ${customs
                      .map(
                        (option) =>
                          `<option value="${escapeAttribute(option)}" ` +
                          `${category.value === option ? 'selected' : ''}>` +
                          `✦ ${escapeHtml(option)}</option>`
                      )
                      .join('')}
                  </optgroup>`
                : ''
            }
          </select>
        </div>

        <div class="flex gap-2 justify-end">
          <button
            class="btn btn-custom"
            onclick="openCustomPool('${key}')"
            title="Add or manage custom signals"
          >＋</button>

          <button
            class="btn btn-lock ${category.locked ? 'active' : ''}"
            id="lock-${key}"
            onclick="toggleLock('${key}')"
            title="Lock"
          >${category.locked ? '🔐' : '🔒'}</button>

          <button
            class="btn btn-random"
            onclick="randomizeCategory('${key}')"
            title="Randomize"
          >🎲</button>

          <button
            class="btn btn-clear"
            onclick="clearCategory('${key}')"
            title="Clear"
          >✕</button>
        </div>
      `;

      panel.appendChild(row);
    });
  };

  // ------------------------------------------------------------
  // UI INJECTION
  // ------------------------------------------------------------

  function injectV5Ui() {
    const style = document.createElement('style');

    style.textContent = `
      .btn-custom {
        color: #58f5ae;
        border-color: #284438;
        font-weight: 700;
      }

      .btn-custom:hover {
        color: #8dffc2;
        border-color: #58f5ae;
        box-shadow: 0 0 10px rgba(88, 245, 174, .28);
      }

      .strumming,
      .strumming * {
        cursor: crosshair !important;
        user-select: none !important;
      }

      .strumming .category-row {
        touch-action: none;
      }

      .strum-zone {
        cursor: ns-resize;
        touch-action: none;
      }

      .custom-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 0, 0, .78);
      }

      .custom-modal {
        width: min(560px, 100%);
        max-height: 80vh;
        overflow: auto;
        padding: 18px;
        background: #12121a;
        border: 1px solid #58f5ae;
        border-radius: 8px;
        box-shadow: 0 0 40px rgba(88, 245, 174, .18);
      }

      .custom-entry-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        margin-bottom: 6px;
        background: #0a0a0f;
        border: 1px solid #242438;
        border-radius: 5px;
      }

      .custom-entry-row span {
        flex: 1;
        color: #d8d8e5;
        font-size: 12px;
        word-break: break-word;
      }

      #customPoolModal.hidden {
        display: none;
      }
    `;

    document.head.appendChild(style);

    const globalControls = document.querySelector(
      '.flex.flex-wrap.gap-3.mb-4'
    );

    if (
      globalControls &&
      !document.getElementById('clearUnlockedBtn')
    ) {
      const clearButton = document.createElement('button');

      clearButton.id = 'clearUnlockedBtn';
      clearButton.className = 'btn btn-clear py-3 px-5';
      clearButton.textContent = '🧹 CLEAR UNLOCKED';
      clearButton.title =
        'Clear subject and all unlocked rows; locked blanks remain blank';
      clearButton.addEventListener('click', clearUnlocked);

      globalControls.appendChild(clearButton);
    }

    const categoriesPanel =
      document.getElementById('categoriesPanel');

    if (
      categoriesPanel &&
      !document.getElementById('strumInstructions')
    ) {
      const hint = document.createElement('div');

      hint.id = 'strumInstructions';
      hint.className =
        'panel p-3 mb-4 text-xs text-gray-500';

      hint.innerHTML =
        '<span class="text-cyan-400">🎸 STRUM:</span> ' +
        'press and drag across row labels to randomize unlocked rows repeatedly as you move. ' +
        'Hold <span class="text-yellow-400">Shift</span> to advance each pool by one.';

      categoriesPanel.before(hint);
    }

    if (!document.getElementById('customPoolModal')) {
      const modal = document.createElement('div');

      modal.id = 'customPoolModal';
      modal.className = 'custom-modal-backdrop hidden';

      modal.innerHTML = `
        <div
          class="custom-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customPoolTitle"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="category-label" id="customPoolTitle">
              CUSTOM SIGNALS
            </span>

            <button
              class="btn btn-clear ml-auto"
              onclick="closeCustomPool()"
            >✕</button>
          </div>

          <p class="text-xs text-gray-500 mb-3">
            Custom signals join this category's random, strum,
            Radar, persistence, and Blueprint pool.
          </p>

          <div class="flex gap-2 mb-4">
            <input
              id="customPoolInput"
              class="subject-input flex-1"
              placeholder="Add a custom signal…"
            >

            <button
              class="btn btn-custom"
              onclick="addCustomOption()"
            >＋ ADD</button>
          </div>

          <div id="customPoolList"></div>
        </div>
      `;

      modal.addEventListener('pointerdown', (event) => {
        if (event.target === modal) closeCustomPool();
      });

      document.body.appendChild(modal);

      document
        .getElementById('customPoolInput')
        .addEventListener('keydown', (event) => {
          if (event.key === 'Enter') addCustomOption();
          if (event.key === 'Escape') closeCustomPool();
        });
    }

    categoriesPanel.addEventListener('pointerdown', beginStrum);
    categoriesPanel.addEventListener('pointermove', moveStrum);
    categoriesPanel.addEventListener('pointerup', endStrum);
    categoriesPanel.addEventListener('pointercancel', endStrum);
    window.addEventListener('pointerup', endStrum);
  }

  // ------------------------------------------------------------
  // BOOT
  // ------------------------------------------------------------

  function bootV5() {
    loadCustomOptions();
    installDarpaCard();
    injectV5Ui();

    document.title =
      'PROMPT FORGE DARPA v5 | AI Image Generation Board';

    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', 'Prompt Forge DARPA v5');

    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute(
        'content',
        'Forge image prompts with strumming, custom pools, curated cards, and model-aware controls.'
      );

    const footer = document.querySelector('footer p');

    if (footer) {
      footer.textContent =
        'FORGED WITH hop.e 💫 | DARPA v5.1 · ' +
        'User-Extensible Prompt Instrument';
    }

    renderCategories();
    renderPresets();
    updateOptionCount();
    updatePreview();
  }

  /*
   * index.html registers its v4 initializer before this file loads.
   * Both run on DOMContentLoaded in registration order: v4 first, then v5.
   */
  document.addEventListener('DOMContentLoaded', bootV5);
})();
