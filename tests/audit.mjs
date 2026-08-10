import fs from 'node:fs';
import vm from 'node:vm';
import { extractVocabulary, toJson, toText, MIRRORS, extractProtocol } from '../tools/vocabulary.mjs';

const SOURCE_PATH = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(SOURCE_PATH, 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

/*
 * index.html carries more than one attribute-free <script> block: the
 * application, then the v5 interaction layer that reassigns parts of it.
 * Select by content rather than position. An earlier version of this harness
 * anchored on `</script>\s*</body>` and matched from the first block to the
 * last, so it swallowed markup as JavaScript and silently verified nothing for
 * two releases. Position is exactly the thing that keeps changing here.
 */
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
if (!blocks.length) {
  fail('No inline script blocks found.');
  process.exit();
}

// Every inline block must at least parse, whichever one we go on to execute.
blocks.forEach((block, index) => {
  try {
    new vm.Script(block);
  } catch (error) {
    fail(`Inline script block ${index + 1} of ${blocks.length} is invalid: ${error.message}`);
  }
});
if (process.exitCode) process.exit();

const APP_MARKER = 'const categories = {';
const appBlocks = blocks.filter(block => block.includes(APP_MARKER));
if (appBlocks.length !== 1) {
  fail(`Expected exactly one inline block defining \`${APP_MARKER}\`; found ${appBlocks.length}.`);
  process.exit();
}

let script = appBlocks[0];
script += `
globalThis.__forgeAudit = {
  counts: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).length])),
  duplicates: Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, category.options.filter(option => !option.startsWith('—')).filter((option, index, all) => all.indexOf(option) !== index)])),
  supplement: Object.fromEntries(Object.entries(PHOSPHOR_SUPPLEMENT).map(([key, values]) => [key, values.length])),
  supplementTotal: Object.values(PHOSPHOR_SUPPLEMENT).reduce((sum, values) => sum + values.length, 0),
  supplementOrphans: Object.entries(PHOSPHOR_SUPPLEMENT).flatMap(([key, values]) =>
    !categories[key] ? [key] : values.filter(value => !categories[key].options.includes(value)).map(value => key + ': ' + value)),
  presetErrors: Object.entries(presets).flatMap(([name, preset]) => Object.entries(preset).filter(([key, value]) => !categories[key] || !categories[key].options.includes(value)).map(([key, value]) => ({ name, key, value }))),
  missingMeta: Object.keys(presets).filter(name => !presetMeta[name]),
  missingFromOrder: Object.keys(categories).filter(key => !promptOrder.includes(key)),
  extraInOrder: promptOrder.filter(key => !categories[key]),
  clusterErrors: Object.entries(categoryClusters).flatMap(([name, keys]) => keys.filter(key => !categories[key]).map(key => ({ name, key }))),
  clusterMembership: Object.entries(categoryClusters).flatMap(([name, keys]) => keys.map(key => ({ name, key }))),
  clusterNames: Object.keys(categoryClusters),
  categoryKeys: Object.keys(categories),
  cardCount: Object.keys(presets).length,
  corruption: (() => {
    const probe = 'Golden Hour';
    const kindsAt = level => Object.keys(categories).map(key => corruptSignal(key, probe, level, 47).kind);
    const sample = level => Object.keys(categories).map(key => corruptSignal(key, probe, level, 47).value).join('|');
    categories.medium.locked = true;
    const lockedResult = corruptSignal('medium', probe, 100, 47);
    categories.medium.locked = false;
    return {
      cleanBelowFirstTick: kindsAt(24).every(kind => kind === 'clean'),
      driftsAtFirstTick: kindsAt(40).some(kind => kind === 'drift'),
      spellsBySecondTick: kindsAt(60).some(kind => kind === 'spell'),
      leetsByThirdTick: kindsAt(85).some(kind => kind === 'leet'),
      zalgoAtLastTick: kindsAt(100).some(kind => kind === 'zalgo'),
      zalgoBelowLastTick: [25, 40, 55, 70, 85, 99].some(level => kindsAt(level).includes('zalgo')),
      cumulativeAtTop: new Set(kindsAt(100)).size > 1,
      deterministic: sample(85) === sample(85),
      seedMatters: sample(85) !== Object.keys(categories).map(key => corruptSignal(key, probe, 85, 999).value).join('|'),
      lockedImmune: lockedResult.kind === 'locked' && lockedResult.value === probe,
      zalgoThreshold: typeof ZALGO_AT === 'number' ? ZALGO_AT : null,
      tickCount: Array.isArray(CHAOS_TICKS) ? CHAOS_TICKS.length : 0
    };
  })(),
  elimination: (() => {
    const pool = categories.colorlogic.options.filter(option => !option.startsWith('—'));
    const inertWhenReleased = applyElimination('colorlogic', pool).length === pool.length;
    setEliminationHeld(true);
    recordElimination('colorlogic', pool[0]);
    const refusedGone = !applyElimination('colorlogic', pool).includes(pool[0]);
    pool.forEach(value => recordElimination('colorlogic', value));
    const afterExhaustion = applyElimination('colorlogic', pool);
    const exhaustionResets = afterExhaustion.length === pool.length && afterExhaustion.length > 0;
    // Two fresh axes: colorlogic was just cleared by its own exhaustion reset.
    recordElimination('mood', 'Serene');
    recordElimination('style', 'Noir');
    const counts = eliminationCount();
    setEliminationHeld(false);
    const releaseClears = eliminationCount() === 0;
    recordElimination('mood', 'Serene');
    const inertAfterRelease = eliminationCount() === 0;
    return { inertWhenReleased, refusedGone, exhaustionResets, counts, releaseClears, inertAfterRelease };
  })(),
  bank: (() => {
    const pool = categories.colorlogic.options.filter(option => !option.startsWith('—'));
    clearBank();
    banSignal('colorlogic', pool[0]);
    // The bank filters with nothing held — that is what "until I clear it" means.
    const filtersUnheld = !applyElimination('colorlogic', pool).includes(pool[0]);
    unbanSignal('colorlogic', pool[0]);
    const unbanRestores = applyElimination('colorlogic', pool).includes(pool[0]);

    let refused = false;
    for (const value of pool) { if (!banSignal('colorlogic', value).ok) { refused = true; break; } }
    const leftStanding = pool.length - (bannedFor('colorlogic').length);
    const stillDrawable = applyElimination('colorlogic', pool).length > 0;

    clearBank();
    const clears = bannedCount() === 0;

    setEliminationHeld(true);
    setBanHeld(true);
    recordElimination('mood', 'Serene');
    const banksOnBanHeld = bannedCount() === 1;
    setBanHeld(false);
    recordElimination('mood', 'Wistful');
    const surveyDoesNotBank = bannedCount() === 1;
    setEliminationHeld(false);
    const outlivesRelease = bannedCount() === 1;
    clearBank();

    // A strum surveys but never banks: one drag refuses hundreds of signals,
    // and permanence should not be reachable by a gesture built to be careless.
    clearBank();
    setEliminationHeld(true);
    setBanHeld(true);
    setBanSuppressed(true);
    recordElimination('style', 'Noir');
    const strumNeverBanks = bannedCount() === 0;
    setBanSuppressed(false);
    recordElimination('texture', 'Satin');
    const bankingReturnsAfterStrum = bannedCount() === 1;
    clearBank();
    setBanHeld(false);
    setEliminationHeld(false);

    return { filtersUnheld, unbanRestores, refused, leftStanding, stillDrawable, clears, banksOnBanHeld, surveyDoesNotBank, outlivesRelease, strumNeverBanks, bankingReturnsAfterStrum };
  })(),
  booru: (() => {
    const orphanKeys = [];
    const badAxes = [];
    const badTags = [];
    Object.entries(BOORU_TAGS).forEach(([axis, table]) => {
      if (!categories[axis]) { badAxes.push(axis); return; }
      const pool = new Set(categories[axis].options);
      Object.entries(table).forEach(([signal, tag]) => {
        if (!pool.has(signal)) orphanKeys.push(axis + ': ' + signal);
        if (tag !== tag.toLowerCase() || /_/.test(tag)) badTags.push(axis + ': ' + tag);
      });
    });
    const mapped = Object.values(BOORU_TAGS).reduce((sum, table) => sum + Object.keys(table).length, 0);
    return { orphanKeys, badAxes, badTags, mapped, mapsQuality: 'quality' in BOORU_TAGS };
  })(),
  bulkImport: (() => {
    const keys = Object.keys(categories);
    const bothSeparators = splitSignalList('alpha, beta\\ngamma').join('|');
    const trimsAndDrops = splitSignalList('  a  ,, \\n , b \\n\\n ').join('|');
    const nullSafe = splitSignalList(null).length === 0 && splitSignalList(undefined).length === 0;

    // 'golden hour' differs from an existing entry only in case; 'Rim Light'
    // repeats within the incoming list itself. Both must be refused.
    const merged = mergeSignalValues(['Golden Hour', 'Noir'], ['golden hour', 'Rim Light', 'rim light', ' ', 'Noir']);
    const mergeNullSafe = mergeSignalValues(null, null).added === 0;
    const preservesCase = mergeSignalValues([], ['Rim Light']).accepted[0] === 'Rim Light';
    const trimsOnMerge = mergeSignalValues([], ['  Rim Light  ']).accepted[0] === 'Rim Light';

    const pools = parseSignalPools('{"wardrobe":["thighhighs","  "],"nonsense":["x"],"mood":"not a list"}', keys);
    const badJson = parseSignalPools('{not json', keys);
    const arrayJson = parseSignalPools('["a"]', keys);
    const nullJson = parseSignalPools('null', keys);
    const blankJson = parseSignalPools('   ', keys);

    return {
      bothSeparators,
      trimsAndDrops,
      nullSafe,
      mergedAdded: merged.added,
      mergedSkipped: merged.skipped,
      mergedAccepted: merged.accepted.join('|'),
      mergeNullSafe,
      preservesCase,
      trimsOnMerge,
      poolsOk: pools.ok,
      poolWardrobe: (pools.pools.wardrobe || []).join('|'),
      poolUnknown: pools.unknown.join('|'),
      poolMalformed: pools.malformed.join('|'),
      badJsonRefused: badJson.ok === false && badJson.reason.length > 0,
      arrayRefused: arrayJson.ok === false,
      nullRefused: nullJson.ok === false,
      blankAccepted: blankJson.ok === true && Object.keys(blankJson.pools).length === 0
    };
  })(),
  rigStates: Object.keys(categories).map(key => {
    const cat = categories[key];
    const read = value => { cat.value = value.value; cat.locked = value.locked; return categoryStateOf(cat); };
    const before = { value: cat.value, locked: cat.locked };
    const observed = {
      live: read({ value: 'x', locked: false }),
      liveBlank: read({ value: '', locked: false }),
      pinned: read({ value: 'x', locked: true }),
      muted: read({ value: '', locked: true })
    };
    cat.value = before.value;
    cat.locked = before.locked;
    return { key, observed };
  }),
  search: (() => {
    const names = hits => hits.map(hit => hit.option).join('|');
    const cast = searchSignals('cast', 5);
    /*
     * Match kind is recomputed here from the option text and the reported
     * offset, deliberately not read off the rank the code produced — a check
     * that trusts the field it is testing passes whatever that field says.
     * (No backticks in this block: it is inside a template literal.)
     *
     * An earlier version of this looked for a signal called "Overcast", which
     * does not exist; the vocabulary has "Overcast Soft Light". The check could
     * never fire and said so to nobody for as long as it was there.
     */
    const wide = searchSignals('cast', 40);
    const kindOf = hit => {
      if (hit.at === 0) return 0;
      const before = hit.option.toLocaleLowerCase()[hit.at - 1];
      return before === ' ' || before === '-' || before === ',' ? 1 : 2;
    };
    const kinds = wide.map(kindOf);
    const custom = searchSignals('zzcustomzz', 5, key => key === 'mood' ? ['ZZcustomZZ signal'] : []);
    return {
      belowMinimum: searchSignals('c', 5).length,
      empty: searchSignals('', 5).length + searchSignals(null, 5).length,
      capped: searchSignals('a', 5).length <= 5 && searchSignals('e', 3).length <= 3,
      castTop: names(cast),
      wideSample: wide.slice(0, 6).map(hit => hit.option).join('|'),
      prefixFirst: cast.length > 0 && cast[0].option.toLocaleLowerCase().startsWith('cast'),
      // Word-start matches must all precede buried ones.
      wellOrdered: kinds.every((kind, index) => index === 0 || kinds[index - 1] <= kind),
      // Both kinds must appear, or the ordering assertion is vacuous.
      sawWordStart: kinds.some(kind => kind < 2),
      sawBuried: kinds.some(kind => kind === 2),
      carriesAxis: cast.length > 0 && Boolean(cast[0].key && cast[0].label),
      marksPosition: cast.length > 0 && cast[0].at === 0,
      noSeparators: searchSignals('—', 5).length === 0,
      usesResolver: names(custom),
      caseInsensitive: names(searchSignals('CAST', 5)) === names(cast)
    };
  })(),
  subjectScope: (() => {
    const modeBefore = outputMode;
    const overridesBefore = { ...subjectOverrides };
    OUTPUT_MODES.forEach(mode => setSubjectOverride(mode, ''));

    const sharedWins = resolveSubject('universal', 'a lighthouse keeper');
    setSubjectOverride('booru', '1girl, solo');
    const overrideWins = resolveSubject('booru', 'a lighthouse keeper');
    const othersUnaffected = resolveSubject('midjourney', 'a lighthouse keeper');
    setSubjectOverride('sdxl', '   ');
    const blankIsNotAnOverride = resolveSubject('sdxl', 'a lighthouse keeper');
    const trimsShared = resolveSubject('universal', '  a lighthouse keeper  ');
    const rejectsUnknownMode = setSubjectOverride('nonsense', 'x') === false;
    const activeReadsBlank = subjectOverrideActive('sdxl') === false && subjectOverrideActive('booru') === true;

    // The whole point: the assembled booru prompt must carry one subject.
    OUTPUT_MODES.forEach(mode => setSubjectOverride(mode, ''));
    setSubjectOverride('booru', 'ZZMARKERZZ');
    outputMode = 'booru';
    categories.lighting.value = categories.lighting.options.find(option => !option.startsWith('—'));
    const built = buildBooruPrompt();
    const markerCount = (built.match(/zzmarkerzz/gi) || []).length;
    const lowercasedSubject = built.includes('zzmarkerzz') && !built.includes('ZZMARKERZZ');
    categories.lighting.value = '';

    // A pre-5.5 blueprint carries its count tag in booruSettings.subject.
    OUTPUT_MODES.forEach(mode => setSubjectOverride(mode, ''));
    applyConfiguration({ booruSettings: { subject: '2girls' } }, false);
    const legacyMigrates = subjectOverrides.booru === '2girls';
    // A blueprint holding both must keep its own, not the legacy field.
    OUTPUT_MODES.forEach(mode => setSubjectOverride(mode, ''));
    applyConfiguration({ subjectOverrides: { booru: '1boy' }, booruSettings: { subject: '2girls' } }, false);
    const newerWins = subjectOverrides.booru === '1boy';

    // The pools.
    customSubjects.booru.length = 0;
    addSubjectToPool('booru', '1girl, solo');
    const poolDedupes = addSubjectToPool('booru', '1GIRL, SOLO').skipped === 1;
    importSubjectsInto('booru', '2girls, 1boy\\nno humans');
    const poolImports = customSubjects.booru.length === 4;
    removeSubjectFromPool('booru', 0);
    const poolRemoves = customSubjects.booru.length === 3 && !customSubjects.booru.includes('1girl, solo');
    const poolsAreSeparate = customSubjects.universal.length === 0;
    const rejectsUnknownPool = addSubjectToPool('nonsense', 'x').added === 0;
    customSubjects.booru.length = 0;

    outputMode = modeBefore;
    Object.keys(overridesBefore).forEach(mode => setSubjectOverride(mode, overridesBefore[mode]));

    return {
      sharedWins, overrideWins, othersUnaffected, blankIsNotAnOverride, trimsShared,
      rejectsUnknownMode, activeReadsBlank, markerCount, lowercasedSubject,
      legacyMigrates, newerWins, poolDedupes, poolImports, poolRemoves,
      poolsAreSeparate, rejectsUnknownPool,
      overrideKeys: Object.keys(subjectOverrides).join(','),
      poolKeys: Object.keys(customSubjects).join(','),
      modeList: OUTPUT_MODES.join(','),
      booruFields: Object.keys(booruSettings).join(',')
    };
  })()
};`;

/*
 * A document stub wide enough to execute the block, not to render it.
 *
 * Functions in the application block increasingly touch the DOM to reflect
 * state — the elimination readout, the chaos zone. They all guard against a
 * missing element, so returning null from every lookup lets them run to
 * completion and lets checks below call them. A stub that omits a method
 * throws instead, which reads as a broken application rather than a stub that
 * needs a line adding.
 */
/*
 * createElement returns a node just real enough for escapeHtml, which builds a
 * detached div, assigns textContent and reads innerHTML back. That idiom is how
 * the application escapes everything it injects, so a stub without it cannot
 * execute any render path — and those are exactly the paths worth reaching.
 */
const makeStubNode = () => {
  const node = { textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } };
  Object.defineProperty(node, 'innerHTML', {
    get: () => String(node.textContent)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    set(value) { node.textContent = value; }
  });
  return node;
};

const context = {
  console,
  document: {
    addEventListener() {},
    createElement: makeStubNode,
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
vm.createContext(context);

try {
  new vm.Script(script);
  vm.runInContext(script, context);
} catch (error) {
  fail(`Application JavaScript is invalid: ${error.stack}`);
  process.exit();
}

const audit = context.__forgeAudit;
const total = Object.values(audit.counts).reduce((sum, count) => sum + count, 0);
const duplicateCount = Object.values(audit.duplicates).reduce((sum, values) => sum + values.length, 0);

if (Object.keys(audit.counts).length !== 17) fail(`Expected 17 axes; found ${Object.keys(audit.counts).length}.`);
if (total !== 2343) fail(`Expected 2,343 signals; found ${total}.`);
if (duplicateCount) fail(`Found ${duplicateCount} duplicate signals.`);
if (audit.cardCount !== 29) fail(`Expected 29 Forge Cards; found ${audit.cardCount}.`);

/*
 * The PHOSPHOR supplement must reach the pools it claims to extend.
 *
 * It spent four releases being merged in from the v5 interaction layer, where
 * neither this harness nor the vocabulary generator could see it: the app
 * offered 2,343 signals while vocabulary.json, vocabulary.txt and llms.txt all
 * said 2,304. You could roll Phosphor Green off the palette axis and then be
 * told by the published LEXICON that it was not a canonical value. It now
 * lives with the rest of the vocabulary, and this checks it arrived.
 */
if (audit.supplementTotal !== 39) fail(`The PHOSPHOR supplement holds ${audit.supplementTotal} signals; expected 39.`);
if (audit.supplementOrphans.length) {
  fail(`PHOSPHOR supplement entries never reached their axis: ${audit.supplementOrphans.slice(0, 4).join('; ')}`);
}
if (audit.presetErrors.length) fail(`Broken Forge Card values: ${JSON.stringify(audit.presetErrors)}`);
if (audit.missingMeta.length) fail(`Forge Cards missing metadata: ${audit.missingMeta.join(', ')}`);
if (audit.missingFromOrder.length || audit.extraInOrder.length) fail('Prompt order does not match the category registry.');
if (audit.clusterErrors.length) fail(`Broken cluster references: ${JSON.stringify(audit.clusterErrors)}`);

/*
 * Every axis is sized to a multiple of sixteen. That has been true since the v4
 * expansion brought each legacy bank to a round target, but it was a convention
 * held by hand and nothing caught a drift. v5.2 took medium from 128 to 160 and
 * the rule is now checked.
 */
const offGrid = Object.entries(audit.counts)
  .map(([key, count]) => [key, count - (audit.supplement[key] || 0)])
  .filter(([, base]) => base % 16 !== 0);
if (offGrid.length) fail(`Axis banks not sized to a multiple of 16: ${offGrid.map(([key, base]) => `${key} (${base})`).join(', ')}`);

/*
 * Reroll scopes must partition the axes. Overlapping scopes are what made the
 * four cluster buttons feel interchangeable before v5.2, and an uncovered axis
 * (colorlogic, until v5.2) is one no cluster button can ever reach.
 */
const clusteredKeys = audit.clusterMembership.map(entry => entry.key);
const duplicatedInClusters = clusteredKeys.filter((key, index) => clusteredKeys.indexOf(key) !== index);
const uncovered = audit.categoryKeys.filter(key => !clusteredKeys.includes(key));
if (duplicatedInClusters.length) fail(`Reroll scopes overlap on: ${[...new Set(duplicatedInClusters)].join(', ')}`);
if (uncovered.length) fail(`Axes reachable by no reroll scope: ${uncovered.join(', ')}`);

/*
 * The chaos dial corrupts signal text, and every property that makes it an
 * instrument rather than a hazard is checked here.
 *
 * The ladder must be cumulative — uniform corruption reads as a filter, and
 * every high-chaos prompt would break the same way. Zalgo must stay at the last
 * tick, because it is the only tier that can defeat a parameter parser and the
 * only one the diagnostics warn about; if it leaked downward the warning would
 * be wrong everywhere. Locked signals must survive, following the rule that
 * pins survive cards, radar, clearing, mutation and randomize. And the same
 * seed must produce the same damage, or a blueprint cannot reproduce a result
 * and nothing here can be tested twice.
 */
const chaos = audit.corruption;
if (!chaos.cleanBelowFirstTick) fail('Chaos corrupts below the first tick; the bottom quarter of the dial must be a passthrough.');
if (!chaos.driftsAtFirstTick) fail('Chaos produces no semantic drift past the first tick.');
if (!chaos.spellsBySecondTick) fail('Chaos produces no misspellings past the second tick.');
if (!chaos.leetsByThirdTick) fail('Chaos produces no leetspeak past the third tick.');
if (!chaos.zalgoAtLastTick) fail('The last tick produces no zalgo, so the final zone does nothing the third does not.');
if (chaos.zalgoBelowLastTick) fail('Zalgo appears below the last tick. Only the final zone may emit combining marks, since only it is warned about.');
if (!chaos.cumulativeAtTop) fail('Corruption at the top of the dial is uniform. The tiers must stay cumulative or every wild prompt breaks identically.');
if (!chaos.deterministic) fail('The same seed and dial setting produced different corruption; chaos must be reproducible to be shareable.');
if (!chaos.seedMatters) fail('Changing the chaos seed changed nothing, so the seed is not reaching the corruption.');
if (!chaos.lockedImmune) fail('Chaos corrupted a locked signal. Pins survive every other automated operation and must survive this one.');
if (chaos.zalgoThreshold !== 100) fail(`Zalgo threshold is ${chaos.zalgoThreshold}; the meter is drawn with its last tick at 100.`);
if (chaos.tickCount !== 4) fail(`Expected 4 chaos ticks; found ${chaos.tickCount}.`);

// Each tick drawn on the meter must match a tier the engine actually has.
const drawnTicks = [...html.matchAll(/class="chaos-tick[^"]*" data-at="(\d+)"/g)].map(match => Number(match[1]));
const engineTicks = [0, 25, 50, 75, 100];
if (drawnTicks.join(',') !== engineTicks.join(',')) {
  fail(`The meter draws ticks at ${drawnTicks.join(', ')}; the corruption ladder steps at ${engineTicks.join(', ')}. A meter that documents itself has to be right.`);
}

/*
 * The strum lane sits beside the board, not inside it.
 *
 * Giving categoriesPanel a flex parent silently changed what
 * `categoriesPanel.before(...)` means: the v5 layer's strum hint went from
 * above the board to beside it, as a third column, and the board shrank to
 * make room. Nothing errored. Anything else that inserts relative to the panel
 * will hit the same edge, so the arrangement is asserted here.
 */
const laneWrapper = html.match(/<div class="board-with-lane[^"]*">([\s\S]*?)<\/div>\s*<!-- Preview Panel -->/);
if (!/<div class="board-with-lane/.test(html)) {
  fail('The strum lane wrapper is gone; the lane and the board must share a flex row.');
} else {
  const region = html.slice(html.indexOf('board-with-lane'), html.indexOf('id="categoriesPanel"'));
  if (!region.includes('id="strumLane"')) {
    fail('The strum lane must come before the category board inside the wrapper, so height maps to axis in reading order.');
  }
  if (!/\.closest\('\.board-with-lane'\)/.test(html)) {
    fail('The strum hint is inserted with categoriesPanel.before without reaching for the wrapper, which puts it beside the board instead of above it.');
  }
}

/*
 * Page order: every section named in the markup must have a rule, and every
 * rule must name a section that exists.
 *
 * The page is arranged with flex order so the board comes before the panels
 * that tune it — 2,231px of scrolling before the first axis, until it did not.
 * That mapping lives in two places, an attribute and a stylesheet, and a
 * section whose name matches nothing silently keeps the fallback position while
 * looking deliberate. Neither half is visible from the other.
 *
 * It applies to both platforms as of 5.5. It was phone-only, which meant two
 * arrangements to keep in step and a desktop that still scrolled past four
 * tuning panels to reach a row.
 */
const orderedSections = [...html.matchAll(/data-section-order="([a-z]+)"/g)].map(match => match[1]);
const styledSections = [...html.matchAll(/\[data-section-order="([a-z]+)"\]\s*\{\s*order:/g)].map(match => match[1]);
const markupSections = orderedSections.filter(name => !styledSections.includes(name));
const orphanRules = styledSections.filter(name => !orderedSections.includes(name));
if (markupSections.length) {
  fail(`These sections carry data-section-order with no rule to place them: ${[...new Set(markupSections)].join(', ')}.`);
}
if (orphanRules.length) {
  fail(`These page order rules name sections that no longer exist: ${[...new Set(orphanRules)].join(', ')}.`);
}
if (!/\.max-w-4xl > \*\s*\{\s*order:/.test(html)) {
  fail('The page order has no default for unlabelled sections, so a new panel would sort above the board rather than below it.');
}
if (/data-mobile-order/.test(html)) {
  fail('data-mobile-order survives somewhere. The order applies to both platforms now, and an attribute that says otherwise will send someone looking for a second arrangement that does not exist.');
}

/*
 * The order must not be inside the media query. It was, and the desktop kept
 * the DOM order — which is the arrangement nobody chose, with the board below
 * four panels that tune it.
 */
const orderRuleAt = html.search(/\[data-section-order="board"\]/);
const mobileQueryAt = html.search(/@media \(max-width: 640px\)/);
if (orderRuleAt === -1) {
  fail('No page order rule for the board.');
} else if (mobileQueryAt !== -1 && orderRuleAt > mobileQueryAt) {
  fail('The page order sits inside the mobile media query, so the desktop falls back to DOM order and only the phone gets the arrangement.');
}

/*
 * The mobile strum runs sideways, and must not fight the scroll it shares a
 * surface with. `touch-action: pan-y` is the whole mechanism: it hands vertical
 * swipes to the page and keeps only horizontal ones. Without it the strip
 * captures both and the page stops scrolling under the thumb.
 */
if (!/\.strum-strip\b[\s\S]{0,600}?touch-action:\s*pan-y/.test(html)) {
  fail('The mobile strum strip does not set touch-action: pan-y, so a vertical swipe on it would fight the page scroll.');
}

/*
 * Button rows that wrap must become grids on a phone, not wrap.
 *
 * A wrapping flex row cannot express "these are equal options" once the count
 * stops dividing into the width: the last item gets a line to itself and
 * stretches to fill it. BOORU rendered 309px against 90-106px for the other
 * three formats — three times the target for the option that is not three
 * times more likely — and the global controls put their primary button's label
 * on two lines while each secondary took a whole row.
 *
 * The !important is load-bearing rather than lazy. The Tailwind CDN generates
 * its utilities at runtime and appends them after this stylesheet, so `.flex`
 * and a later `display: grid` tie on specificity and source order hands it to
 * Tailwind. Both rules are checked for it, because without it they parse fine,
 * look right in the file, and do nothing in the browser.
 */
const mobileBlock = (html.match(/@media \(max-width: 640px\) \{[\s\S]*?\n    \}/) || [''])[0];
if (!mobileBlock) {
  fail('The 640px mobile block could not be located, so none of the phone layout can be checked.');
} else {
  [
    ['.mode-row', 'the four output-format buttons'],
    ['#globalControls', 'the global control row']
  ].forEach(([selector, what]) => {
    /*
     * All rules for the selector, not the first. These sections carry a
     * separate `order:` rule for the mobile reordering, and matching only the
     * first one checked the wrong declaration block entirely — it passed for
     * the wrong reason until the layout rule was written, then failed for the
     * wrong reason once it was.
     */
    const rules = [...mobileBlock.matchAll(new RegExp(selector + '\\s*\\{[^}]*\\}', 'g'))].map(match => match[0]);
    if (!rules.length) {
      fail(`${what} has no mobile rule, so it wraps and the last button stretches to fill its own line.`);
      return;
    }
    if (!rules.some(rule => /display:\s*grid\s*!important/.test(rule))) {
      fail(`${what} does not set display: grid !important on mobile. Without the !important the Tailwind CDN's runtime .flex wins on source order and the rule does nothing.`);
    }
    if (!rules.some(rule => /grid-template-columns:\s*repeat\(2,/.test(rule))) {
      fail(`${what} does not lay out in two equal columns on mobile.`);
    }
  });
}

/*
 * Elimination: a survey, and a survey that ends.
 *
 * Holding the modifier sets aside every value rolled past, so each draw shows
 * something unseen. Three properties make that a feature rather than a trap.
 *
 * It must be inert when released, or a mode nobody is in still changes what the
 * dice can return. It must reset on exhaustion rather than deadlock — an axis
 * with nothing left to draw would silently stop responding, which reads as a
 * broken button rather than a completed sweep. And releasing must clear, since
 * the state describes an act of looking and a survey resumed later is a
 * different survey.
 */
const elim = audit.elimination;
if (!elim.inertWhenReleased) fail('Elimination filters candidates while released; it must do nothing unless the modifier is held.');
if (!elim.refusedGone) fail('A value rolled past is still offered while eliminating.');
if (!elim.exhaustionResets) fail('Elimination deadlocks on an exhausted pool instead of starting the sweep again. An axis with no candidates stops responding.');
if (elim.counts < 2) fail(`Elimination counted ${elim.counts} set-aside signals across two axes; the readout would understate what it has refused.`);
if (!elim.releaseClears) fail('Releasing the modifier does not clear the set-aside signals.');
if (!elim.inertAfterRelease) fail('Elimination keeps accumulating after release, so the next survey starts dirty.');

/*
 * The bank: elimination that outlives the key.
 *
 * Shift records looking and clears when released. Ctrl+Shift records deciding
 * and does not — banked signals are filtered from every draw whether or not
 * anything is held, and only clearing the bank brings them back. Those are
 * different lifetimes and the difference is the feature.
 *
 * The dangerous property is that it is permanent. A survey rescued itself on
 * release; a bank has no such moment, so an axis refused down to nothing would
 * stay unrollable and read as a broken board. banSignal therefore refuses to
 * take an axis below two remaining signals, which is better than accepting the
 * ban and quietly ignoring it later.
 */
const bank = audit.bank;
if (!bank.filtersUnheld) fail('Banked signals are only filtered while a key is held; the bank must apply to every draw or "until I clear it" means nothing.');
if (!bank.unbanRestores) fail('Restoring a banked signal does not return it to the pool.');
if (!bank.refused) fail('The bank accepted every signal on an axis. It must refuse before a pool can be emptied, since nothing rescues a permanent ban.');
if (bank.leftStanding < 2) fail(`The bank left ${bank.leftStanding} signal(s) on an axis; it must leave at least two so the axis can still be rolled.`);
if (!bank.stillDrawable) fail('An axis with a full bank has no candidates left to draw.');
if (!bank.clears) fail('Emptying the bank does not empty the bank.');
if (!bank.banksOnBanHeld) fail('Ctrl+Shift does not route a passed-over signal into the bank.');
if (!bank.surveyDoesNotBank) fail('Shift alone banks signals permanently; only the deciding modifier may do that.');
if (!bank.outlivesRelease) fail('The bank clears when the modifier is released, which makes it a survey rather than a bank.');
if (!bank.strumNeverBanks) fail('A strum can bank signals. One drag refuses hundreds; permanence must not be reachable by a gesture designed to be careless.');
if (!bank.bankingReturnsAfterStrum) fail('Banking stays suppressed after the strum ends, so a click can no longer bank.');

/*
 * One modifier, one meaning, on every surface.
 *
 * Shift used to mean step-strum on a drag and survey on a click, which was
 * defensible only because step never randomises. It still read as two rules.
 * Shift now surveys everywhere and Ctrl steps, so the drag surfaces must not
 * be deciding step from shiftKey any more.
 */
const stepFromShift = (html.match(/strumMode = [^;]*shiftKey[^;]*'step'/g) || []).length;
if (stepFromShift) {
  fail(`${stepFromShift} strum surface(s) still choose step mode from Shift. Shift surveys everywhere; Ctrl steps.`);
}
const stepFromCtrl = (html.match(/strumMode = \((?:event|laneKey)\.ctrlKey \|\| (?:event|laneKey)\.metaKey\) \? 'step' : 'random'/g) || []).length;
if (stepFromCtrl !== 4) {
  fail(`${stepFromCtrl} of 4 strum surfaces choose step from Ctrl; the rest would be unreachable or inconsistent.`);
}

/*
 * The blur handler is not optional. A keyup fired while the window is unfocused
 * never arrives, so alt-tabbing mid-survey would strand the mode on with no key
 * held and nothing to explain it.
 */
const blurHandler = (html.match(/window\.addEventListener\('blur',[\s\S]{0,220}?\}\)|window\.addEventListener\('blur',[^\n]*/) || [''])[0];
if (!/setEliminationHeld\(false\)/.test(blurHandler)) {
  fail('Nothing clears elimination on window blur, so losing focus mid-survey would leave the mode stuck on.');
}
if (!/setBanHeld\(false\)/.test(blurHandler)) {
  fail('Losing focus does not clear the banking modifier, so the next reroll after alt-tabbing could bank a signal permanently without the key being held.');
}

/*
 * The per-axis dice must be addressable, or the mode goes quiet where it is
 * most used.
 *
 * Elimination has always applied to every reroll path, since they all run
 * through pickRandomOption — but at first only the roll-all button said so, and
 * a capability that is silent on the control that has it is indistinguishable
 * from one wired to the wrong control. That is what it was reported as. The
 * readout needs an id on each row's roll button to find.
 */
const rollButtonIds = (html.match(/id="roll-\$\{key\}"/g) || []).length;
if (rollButtonIds < 2) {
  fail(`Row reroll buttons carry no id in ${2 - rollButtonIds} of their two templates; the elimination readout cannot reach them.`);
}
if (!/getElementById\(`roll-\$\{key\}`\)/.test(html)) {
  fail('syncEliminationUI no longer looks up the per-axis roll buttons, so elimination would only be visible on the roll-all control.');
}

/*
 * The booru map must stay attached to the vocabulary it translates.
 *
 * It is a second vocabulary keyed by the first, which is the shape of thing
 * that rots quietly: rename a signal upstream and its tag becomes unreachable
 * with nothing failing. Every key is therefore checked against the live pool,
 * which is the same rule the Forge Cards live under.
 *
 * Tags are checked for form as well. Danbooru's canonical form uses
 * underscores, but the SDXL finetunes this targets were trained on the
 * space-separated rendering — emitting `hand_on_hip` to Illustrious is a
 * near-miss token, which is worse than the prose it replaced.
 *
 * And quality is deliberately unmapped. That axis speaks a different language
 * than "masterpiece, absurdres"; mapping it would invent a correspondence that
 * does not exist, which is the thing this file exists to prevent.
 */
const booru = audit.booru;
if (booru.badAxes.length) fail(`The booru map names axes that do not exist: ${booru.badAxes.join(', ')}.`);
if (booru.orphanKeys.length) {
  fail(`${booru.orphanKeys.length} booru mapping(s) point at signals no longer in the vocabulary: ${booru.orphanKeys.slice(0, 4).join('; ')}${booru.orphanKeys.length > 4 ? '…' : ''}`);
}
if (booru.badTags.length) {
  fail(`Tags must be lowercase and space-separated for these checkpoints: ${booru.badTags.slice(0, 4).join('; ')}`);
}
if (booru.mapsQuality) fail('The booru map translates the quality axis. Booru checkpoints use their own quality vocabulary; that axis is replaced by the scaffolding, not mapped.');
if (booru.mapped < 80) fail(`Only ${booru.mapped} signals map to tags; the mode would pass almost everything through as prose.`);

/*
 * Signal search: five results, and therefore the right five.
 *
 * This replaced the Option Radar, which returned 48 hits in a panel a page
 * below the board. Five is the whole difference — 48 is a page you read, five
 * is a suggestion you glance at — but five only works if the ranking is right.
 * A plain substring match answers "cast" with "Overcast" ahead of "Cast Iron"
 * and the feature feels broken at exactly the query length people type.
 *
 * Starts-with first, then the start of any word, then buried in the middle.
 */
const search = audit.search;
if (search.belowMinimum !== 0) fail('Search returns hits for a single character; it must wait for two or every keystroke rebuilds the list from thousands of matches.');
if (search.empty !== 0) fail('Search returns hits for an empty or null query.');
if (!search.capped) fail('Search ignores its result limit. The list hangs over the board, and an uncapped one would cover it.');
if (!search.prefixFirst) fail(`Search did not rank a starts-with match first for "cast"; got ${search.castTop}.`);
if (!search.sawWordStart || !search.sawBuried) {
  fail(`The "cast" probe no longer returns both word-start and mid-word matches (${search.wideSample}), so the ordering check below proves nothing. Pick a query that does.`);
}
if (!search.wellOrdered) {
  fail(`A mid-word match outranks a word-start one for "cast" (${search.wideSample}). "Overcast Soft Light" must not sit above "Sand Casting", or five results is far too few to be useful.`);
}
if (!search.carriesAxis) fail('Search hits do not carry their axis, so a result cannot say where it would land or be applied to it.');
if (!search.marksPosition) fail('Search hits do not report where the match begins, so the matched run cannot be highlighted.');
// The em-dash group separators in each pool are furniture, not signals. They
// are skipped everywhere else that counts or draws, and search is no exception.
if (!search.noSeparators) fail('Search returns the em-dash group separators as though they were signals.');
if (search.usesResolver !== 'ZZcustomZZ signal') {
  fail(`Search ignored its option resolver (got ${search.usesResolver}). The interaction layer passes getCombinedOptions through it, and without that custom signals are unsearchable.`);
}
if (!search.caseInsensitive) fail('Search is case-sensitive.');

if (/id="radarInput"|id="radarResults"|function toggleRadarPanel/.test(html)) {
  fail('The Option Radar panel survives alongside the board search. Two searches over the same vocabulary is the state this replaced.');
}
if (!/id="signalSearch"/.test(html)) fail('There is no search field in the strip above the board.');
if (!/\.signal-search-results\s*\{[^}]*position:\s*absolute/.test(html)) {
  fail('The search results are in flow rather than hanging over the board, so typing pushes the rows down the screen while you are reading them.');
}

/*
 * Injected controls must be anchored by id, not by layout classes.
 *
 * CLEAR UNLOCKED is created by the interaction layer and appended to the
 * global control row, which used to be found with `.flex.flex-wrap.gap-3.mb-4`
 * — a selector made entirely of layout utilities, naming the row only for as
 * long as nobody restyled it. Folding the controls into the Signal Rig changed
 * exactly those classes. The button would have stopped being injected with no
 * error and no missing element to find: a control that quietly ceases to exist.
 *
 * The strum hint has hit the same class of bug from the other direction, where
 * an insertion point kept working and started meaning somewhere else.
 */
if (!/getElementById\('globalControls'\)/.test(html)) {
  fail('The global control row is not located by id, so restyling it would silently stop CLEAR UNLOCKED being injected.');
}
if (!/id="globalControls"/.test(html)) {
  fail('There is no #globalControls for the injected clear button to attach to.');
}
if (/querySelector\(\s*['"]\.flex\.flex-wrap/.test(html)) {
  fail('Something is still finding an element by its layout utility classes. Those name a box only until it is restyled.');
}

/*
 * One button, one behaviour, one name.
 *
 * allCategoriesLive and unlockAll were the same function written twice — the
 * rig's copy simply forgot to release the subject — surfaced as ALL LIVE and
 * UNLOCK ALL in two panels a page apart. The difference between them was not a
 * decision, it was a dropped line.
 */
if (/function allCategoriesLive/.test(html)) {
  fail('allCategoriesLive is back. It is unlockAll without the subject, and having both is how the same button ended up in two panels under two names.');
}
if (/onclick="allCategoriesLive\(\)"/.test(html)) {
  fail('A control still calls allCategoriesLive, which no longer exists.');
}

/*
 * Bulk import: the only path by which a stranger's vocabulary enters the board.
 *
 * Everything checked here is a way an import can appear to succeed while
 * quietly doing something else. A pool that ends up holding "Golden Hour" and
 * "golden hour" is the worst of them, because both render identically in every
 * list the interface draws and nothing afterwards can tell you which one a roll
 * produced. Case-insensitive deduplication is therefore not a nicety.
 *
 * The counts matter for the same reason. An import that reports what it added
 * and stays silent about what it refused is a small lie that surfaces an hour
 * later, when a signal the user believes they added never appears in a draw.
 *
 * And a malformed file must change nothing at all. A half-applied import that
 * reports success leaves a board no one can reason about; a refusal leaves a
 * board that is exactly where it was.
 */
const bulk = audit.bulkImport;
if (bulk.bothSeparators !== 'alpha|beta|gamma') {
  fail(`Bulk import split "alpha, beta\\ngamma" into ${bulk.bothSeparators}; commas and newlines must both separate, since that is how lists are written and how tag strings arrive.`);
}
if (bulk.trimsAndDrops !== 'a|b') {
  fail(`Bulk import produced ${bulk.trimsAndDrops} from a list padded with blanks; empty entries and surrounding space must not become signals.`);
}
if (!bulk.nullSafe || !bulk.mergeNullSafe) fail('Bulk import throws on an empty field instead of importing nothing.');
if (bulk.mergedAccepted !== 'Rim Light') {
  fail(`Merging accepted ${bulk.mergedAccepted}. Only the one genuinely new signal may survive: a differently-cased copy of an existing signal is indistinguishable from it in every list the board draws.`);
}
if (bulk.mergedAdded !== 1 || bulk.mergedSkipped !== 3) {
  fail(`Merging reported ${bulk.mergedAdded} added and ${bulk.mergedSkipped} skipped; expected 1 and 3. Unreported skips are what make a signal seem to vanish after import.`);
}
if (!bulk.preservesCase || !bulk.trimsOnMerge) {
  fail('Merging rewrote an accepted signal. Deduplication ignores case; storage must not — the user typed what they typed.');
}
if (!bulk.poolsOk || bulk.poolWardrobe !== 'thighhighs') {
  fail(`Whole-board import parsed wardrobe as ${bulk.poolWardrobe}; blank entries must be dropped there too.`);
}
if (bulk.poolUnknown !== 'nonsense') fail(`Unknown axes reported as ${bulk.poolUnknown}; a set written for a different board must say so rather than half-apply.`);
if (bulk.poolMalformed !== 'mood') fail(`A known axis holding a non-list was reported as ${bulk.poolMalformed}; that is a different complaint from an unknown axis and is reported separately.`);
if (!bulk.badJsonRefused) fail('Malformed JSON is accepted by the whole-board import. It must refuse with a reason and change nothing.');
if (!bulk.arrayRefused) fail('A bare JSON array is accepted as a pool map; the format is an object keyed by axis.');
if (!bulk.nullRefused) fail('JSON null is accepted as a pool map.');
if (!bulk.blankAccepted) fail('An empty box is treated as an error rather than as nothing to import.');

/*
 * The wiring must reach the rules. These three functions live in the
 * application block precisely so the checks above can execute them; if the
 * interaction layer grew its own copy, everything above would be verifying code
 * that no longer runs — which is the exact failure this harness was rebuilt to
 * stop after it spent two releases auditing markup.
 */
['splitSignalList', 'mergeSignalValues', 'parseSignalPools'].forEach(name => {
  if (!appBlocks[0].includes(`function ${name}(`)) {
    fail(`${name} is not defined in the application block, so the harness cannot execute the rule it enforces.`);
  }
  if (!blocks.some(block => block !== appBlocks[0] && block.includes(`${name}(`))) {
    fail(`${name} is defined but the interaction layer never calls it, so the import path is running some other rule.`);
  }
});

// The controls have to exist for any of it to be reachable.
['customPoolBulk', 'customPoolJson', 'customPoolReplace'].forEach(id => {
  if (!html.includes(`id="${id}"`)) fail(`The custom pool modal has no #${id}; part of the import surface is unreachable.`);
});
['importCustomList', 'exportCustomPools', 'importCustomPools'].forEach(name => {
  if (!html.includes(`window.${name} =`)) fail(`${name} is wired to a control but never defined on window, so the inline handler would throw.`);
  if (!html.includes(`onclick="${name}()"`)) fail(`${name} is defined but no control calls it.`);
});

/*
 * One subject, four dialects, and at most one override each.
 *
 * The bug this replaced: booruSettings.subject prepended "1girl, solo" to
 * every booru prompt unconditionally, while the board's real subject went in
 * immediately after it. Two subjects, adjacent, contradicting each other, on
 * every prompt — including ones whose subject was a cracked helmet. The
 * marker check below is the direct guard against it coming back: an assembled
 * booru prompt must contain its subject exactly once.
 *
 * The fallback is the other half. Three of the four modes want the same
 * sentence, and flipping between them to compare dialects is a reason to use
 * this at all — so a mode with no override of its own must resolve to the
 * shared subject rather than to nothing.
 */
const subj = audit.subjectScope;
if (subj.modeList !== 'universal,midjourney,sdxl,booru') fail(`OUTPUT_MODES reads ${subj.modeList}; the four formats are declared in one place and everything else derives from it.`);
if (subj.overrideKeys !== subj.modeList) fail(`Subject overrides cover ${subj.overrideKeys} but the modes are ${subj.modeList}; a mode with no override slot silently cannot have one.`);
if (subj.poolKeys !== subj.modeList) fail(`Subject pools cover ${subj.poolKeys} but the modes are ${subj.modeList}.`);
if (subj.booruFields.includes('subject')) {
  fail('booruSettings still carries a subject field. That is the duplicate-subject bug: the board already has a subject, and a second one prepended here appears in every booru prompt alongside it.');
}
if (subj.sharedWins !== 'a lighthouse keeper') fail(`A mode with no override resolved to ${JSON.stringify(subj.sharedWins)} instead of the shared subject; comparing the same idea across formats depends on that fallback.`);
if (subj.overrideWins !== '1girl, solo') fail(`An override did not win for its own mode; got ${JSON.stringify(subj.overrideWins)}.`);
if (subj.othersUnaffected !== 'a lighthouse keeper') fail('Setting one mode\'s override changed another mode\'s subject; the overrides must be per-format or the feature is a global rename.');
if (subj.blankIsNotAnOverride !== 'a lighthouse keeper') fail('A whitespace-only override suppressed the shared subject. Clearing a field leaves a stray space in some browsers, and the board would read as having lost the subject.');
if (subj.trimsShared !== 'a lighthouse keeper') fail('The shared subject is not trimmed before use.');
if (!subj.rejectsUnknownMode) fail('setSubjectOverride accepted a mode that does not exist, which would create a fifth override nothing ever reads.');
if (!subj.activeReadsBlank) fail('subjectOverrideActive disagrees with resolveSubject about whether an override is set, so the UI would light up for an override that is not applied, or stay dark for one that is.');
if (subj.markerCount !== 1) {
  fail(`The assembled booru prompt contains its subject ${subj.markerCount} times; it must appear exactly once. Two is the duplicate-subject bug returning.`);
}
if (!subj.lowercasedSubject) fail('The subject enters booru tag space without being lowercased, so it reads as a different kind of thing than the tags around it.');
if (!subj.legacyMigrates) fail('A pre-5.5 blueprint\'s booruSettings.subject is dropped rather than read into the booru override. Those saves were built around that tag being present.');
if (!subj.newerWins) fail('A blueprint carrying both an override and the legacy field lets the legacy field win, so migrating a save would undo it.');
if (!subj.poolDedupes) fail('The subject pool accepted a differently-cased duplicate.');
if (!subj.poolImports) fail('Bulk import into a subject pool did not take a comma-and-newline list.');
if (!subj.poolRemoves) fail('Removing a subject from a pool did not remove it.');
if (!subj.poolsAreSeparate) fail('Adding a subject to one format\'s pool put it in another\'s; the pools are per-format because a good booru subject is noise in a Midjourney prompt.');
if (!subj.rejectsUnknownPool) fail('A subject was added to a pool for a mode that does not exist.');

// The override has to be reachable, and the field it replaced must be gone.
['subjectOverrideInput', 'subjectOverrideMode', 'subjectPoolChips', 'subjectPoolBulk'].forEach(id => {
  if (!html.includes(`id="${id}"`)) fail(`The subject panel has no #${id}; part of the per-format subject surface is unreachable.`);
});
if (html.includes('id="booruSubject"')) {
  fail('The BOORU panel still has its own subject field. It was replaced by the per-format override; leaving both is how the prompt got two subjects in the first place.');
}
/*
 * Collapsed by default, never collapsed while it is changing the prompt.
 *
 * The panel is folded shut because most sessions never need it. A subject
 * quietly substituted by a control that is out of sight is the same class of
 * problem as the duplicate subject this feature replaced — output disagreeing
 * with the visible board and nothing on screen saying why — so an override in
 * force must force the panel open and state itself in the summary.
 */
if (!/<details id="subjectOverridePanel"/.test(html)) {
  fail('The per-format subject override is not collapsible; it is a control most sessions never touch and it sits above the board.');
}
if (/<details id="subjectOverridePanel"[^>]*\bopen\b/.test(html)) {
  fail('The subject override panel ships open. It should default collapsed and open itself only when an override is set.');
}
if (!/if \(active\) panel\.open = true;/.test(html)) {
  fail('Nothing forces the subject override panel open when an override is active, so a format could substitute its subject from behind a folded-shut control.');
}
if (!/subjectOverrideState/.test(html)) {
  fail('The collapsed override panel has no summary readout, so the one state worth knowing while it is shut is invisible.');
}

if (!/applySubjectFromPool\(\$\{index\}\)/.test(html)) {
  fail('Subject chips do not dispatch by index. A subject is user-authored text that can contain quotes and backslashes, and passing it through an inline onclick needs HTML and JavaScript escaping at once.');
}

// Every declared output mode needs a button, and every button a mode.
const declaredModes = (html.match(/\['universal', 'midjourney', 'sdxl', 'booru'\]/g) || []).length;
if (declaredModes < 2) fail('The output-mode list is inconsistent; booru must appear everywhere modes are validated or toggled.');
if (!/id="mode-booru"/.test(html)) fail('BOORU is a valid output mode with no button to select it.');

// The Signal Rig reads three states out of the two persisted properties.
const badStates = audit.rigStates.filter(({ observed }) =>
  observed.live !== 'live' ||
  observed.liveBlank !== 'live' ||
  observed.pinned !== 'pinned' ||
  observed.muted !== 'muted');
if (badStates.length) fail(`Rig state derivation is wrong for: ${badStates.map(entry => entry.key).join(', ')}`);

/*
 * Prompt Forge is one file. Nothing may reintroduce a local *render*
 * dependency — something the page must fetch before it works.
 *
 * Stylesheets count, scripts count. `rel="alternate"` does not: it points at
 * vocabulary.json for machine readers, and the page renders and runs whether or
 * not that file is reachable. Scoping this to rel="stylesheet" rather than every
 * <link> is the difference between a check that describes self-containment and
 * one that merely forbids local hrefs.
 */
const stylesheetRefs = [...html.matchAll(/<link\s([^>]*)>/g)]
  .map(match => match[1])
  .filter(attrs => /rel=["'][^"']*\bstylesheet\b/.test(attrs))
  .map(attrs => (attrs.match(/href=["']([^"']+)["']/) || [])[1])
  .filter(Boolean)
  .map(ref => ({ tag: 'stylesheet', ref }));

const localRefs = [
  ...[...html.matchAll(/<script\s[^>]*src=["']([^"']+)["']/g)].map(match => ({ tag: 'script', ref: match[1] })),
  ...stylesheetRefs
].filter(({ ref }) => !/^(https?:)?\/\//.test(ref) && !/^(data|#)/.test(ref));
if (localRefs.length) fail(`index.html is not self-contained; it loads ${localRefs.map(entry => `${entry.ref} (${entry.tag})`).join(', ')}.`);

/*
 * The published vocabulary files must match the application exactly.
 *
 * vocabulary.json and vocabulary.txt exist so machine readers do not have to
 * scrape a 175 kB single-file app whose signal pools start past most fetch
 * truncation limits. That only helps if they are true. A stale vocabulary file
 * is worse than no vocabulary file: it is authoritative-looking, publicly
 * cached, and wrong in a way nobody notices until a prompt references a signal
 * the forge does not have.
 *
 * Regenerate with `npm run vocabulary` after changing any pool.
 */
const version = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const published = [
  { file: 'vocabulary.json', expected: () => toJson(extractVocabulary(html), version) },
  { file: 'vocabulary.txt', expected: () => toText(extractVocabulary(html), version) }
];

// Compare content, not line endings. git's autocrlf rewrites these files on
// checkout under its default Windows configuration, which would otherwise fail
// this check on a clean clone and make the suite look broken to a new
// contributor before they had changed anything.
const normalize = text => text.replace(/\r\n/g, '\n');

for (const { file, expected } of published) {
  const path = new URL(`../${file}`, import.meta.url);
  if (!fs.existsSync(path)) {
    fail(`${file} is missing. Run \`npm run vocabulary\`.`);
    continue;
  }
  if (normalize(fs.readFileSync(path, 'utf8')) !== normalize(expected())) {
    fail(`${file} does not match index.html. Run \`npm run vocabulary\`.`);
  }
}

// The front door has to point at files that exist, or it is worse than absent.
const llms = fs.readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');

/*
 * llms.txt is hard-wrapped, so any required sentence longer than a line is
 * split by a newline and a prose check written as one string silently stops
 * matching. That is a check that fails when the file is reflowed rather than
 * when the rule is removed — worse than no check, since it trains you to
 * ignore it. Structural checks below still read `llms`; prose checks read this.
 */
const llmsFlat = llms.replace(/\s+/g, ' ');
for (const ref of ['vocabulary.json', 'vocabulary.txt']) {
  if (!llms.includes(ref)) fail(`llms.txt does not reference ${ref}.`);
}

/*
 * Mirrors must be reachable from every entry point.
 *
 * An agent whose fetcher allowlists hosts can be blocked from *.github.io, and
 * that blocks llms.txt along with everything else — the reader fails before
 * reaching the sentence that would have told them where else to look. One
 * observed in the wild stopped rather than fabricating, which is the file
 * working, but it should not have had to stop at all.
 *
 * So every door carries the address of the others: llms.txt, both generated
 * vocabulary files, and the <head> meta that survives truncation.
 */
if (!/^#+ ACCESS$/m.test(llms)) {
  fail('llms.txt has no ACCESS section telling a blocked reader that nothing is gated.');
}

/*
 * llms.txt is two documents in one file: a PROTOCOL that is complete on its
 * own, and a LEXICON that is optional. That split is the whole design — an
 * agent that can read only this file must still be able to operate the board,
 * because the two failures seen in the wild were a truncated fetch and a
 * blocked host. Putting the protocol in a second file would reintroduce both.
 */
for (const heading of ['## PROTOCOL', '## LEXICON']) {
  if (!llms.includes(heading)) {
    fail(`llms.txt is missing its ${heading.replace('## ', '')} section; the protocol/lexicon split is what makes the file self-sufficient.`);
  }
}

/*
 * Every axis must be named in llms.txt, with a gloss.
 *
 * The protocol is only portable if an agent can fill an axis from its own
 * knowledge, and it cannot do that for `colorlogic` or `figure` from the key
 * alone. Adding an axis to the app without describing it here would leave the
 * machine-facing contract quietly one axis short — exactly the drift this
 * suite exists to catch.
 */
const undescribed = audit.categoryKeys.filter(key => !new RegExp(`^${key}\\s{2,}\\S`, 'm').test(llms));
if (undescribed.length) {
  fail(`llms.txt does not describe these axes: ${undescribed.join(', ')}. Each needs a line of the form "<key>  <what it means>".`);
}

// The prompt is the deliverable; rendering is optional and additional.
if (!/never instead of/i.test(llmsFlat) || !/Always return/i.test(llmsFlat)) {
  fail('llms.txt no longer states that the prompt is always returned and that image generation is additional.');
}

/*
 * The anti-bluff mechanism.
 *
 * An agent asked to use the board replied with an idea and an image, no axis
 * lines, and then answered a challenge by asserting it had selected from the
 * categories. That claim was unfalsifiable, which is the actual defect: a
 * protocol nobody can check is a protocol nobody follows. Two things fix it —
 * saying that an unshown selection does not count, and showing the exact shape
 * of a compliant reply, since models copy a worked example far more reliably
 * than they follow a rule.
 */
if (!/not a Prompt Forge result/i.test(llmsFlat)) {
  fail('llms.txt no longer states that a reply without the axis lines does not count.');
}
if (!/^### Example of a compliant reply$/m.test(llms) || !/^Mode: /m.test(llms) || !/^Subject: /m.test(llms)) {
  fail('llms.txt is missing the worked example, or the example no longer shows a subject line.');
}

/*
 * Every axis considered, every blank reported.
 *
 * An agent filled five axes and said nothing about the other twelve. Nothing
 * in that reply distinguished twelve deliberate omissions from a pass that
 * stopped after five, and in the output those are identical. Naming the blanks
 * is the only evidence restraint happened — which is why it is required, and
 * why the reasons are not.
 */
if (!/all seventeen axes in order/i.test(llmsFlat)) {
  fail('llms.txt no longer tells the reader to consider every axis in turn.');
}

/*
 * The contract has to survive the second turn.
 *
 * An agent that had just produced a fully compliant reply was asked for "one
 * more" and returned prose and an image with no axes at all. It did not refuse
 * the protocol; it stopped treating the exchange as one. A follow-up reads as
 * conversation, and conversation is where a fetched instruction goes quiet, so
 * the file has to say that a variation is a new prompt.
 */
if (!/including follow-ups/i.test(llmsFlat) || !/second request is a second prompt/i.test(llmsFlat)) {
  fail('llms.txt no longer states that follow-ups and variations get the full output again.');
}
if (!/^Blank: /m.test(llms) || !/comes to seventeen/i.test(llmsFlat)) {
  fail('llms.txt no longer requires every blank axis to be reported by name.');
}

/*
 * Two things an agent got wrong even while following the contract.
 *
 * It produced a Blank list and dropped one axis from it — sixteen accounted
 * for out of seventeen, palette simply gone. Stating the total is not the same
 * as asking for the total to be checked, so the file now says to count.
 *
 * It also returned the idea, subject, axes and mode, and no assembled prompt.
 * Four parts of five, missing the only one that is the deliverable rather than
 * a description of it. That needed saying outright.
 */
if (!/Count before you send/i.test(llmsFlat)) {
  fail('llms.txt no longer asks the reader to check that filled plus blank equals seventeen.');
}

/*
 * The agent supplies the idea unless given one.
 *
 * "State the single idea the image serves" was read as "the human states it
 * and I restate it": an agent reported the protocol internalised, then asked
 * for an idea and waited. Nothing had gone wrong except deference — a request
 * to use the tool had been turned into a request for requirements. The file
 * now says the idea and subject are the agent's to choose by default, and that
 * announcing readiness is not a reply.
 */
if (!/Choose the idea and the subject yourself/i.test(llmsFlat) || !/the first reply is the work/i.test(llmsFlat)) {
  fail('llms.txt no longer states that the agent picks the idea and subject itself rather than asking for them.');
}

/*
 * Corruption has to be announced to downstream readers.
 *
 * The dial deliberately emits malformed tokens, and most models will silently
 * repair a misspelling on the way past — which discards the choice and returns
 * an image nobody asked for. The damage is load-bearing, so the file has to say
 * so where an agent handling the prompt will see it.
 */
if (!/Corrupted signals are deliberate/i.test(llmsFlat) || !/Do not correct it/i.test(llmsFlat)) {
  fail('llms.txt no longer warns that corrupted signals are deliberate and must not be repaired downstream.');
}
if (!/must never be absent/i.test(llmsFlat)) {
  fail('llms.txt no longer singles out the assembled prompt as the part that cannot be omitted.');
}

/*
 * The worked example must itself account for every axis, since it is the shape
 * agents copy. An eighteenth axis that never reached the example would teach a
 * seventeen-axis habit, and the rule above would be contradicted by the only
 * demonstration of it in the file.
 */
const example = llms.split('### Example of a compliant reply')[1] || '';
const exFilled = [...(example.split('Prompt:')[0] || '').matchAll(/^([a-z]+)\s{2,}/gm)].map(match => match[1]);
const exBlank = ((example.match(/^Blank: ([^\n]+)/m) || [])[1] || '')
  .replace(/\.$/, '').split(',').map(entry => entry.trim()).filter(Boolean);
const accounted = new Set([...exFilled, ...exBlank]);
const unaccounted = audit.categoryKeys.filter(key => !accounted.has(key));
const bogus = [...accounted].filter(key => !audit.categoryKeys.includes(key));
const bothWays = exFilled.filter(key => exBlank.includes(key));
if (unaccounted.length) fail(`The llms.txt example neither fills nor blanks: ${unaccounted.join(', ')}. It must account for every axis.`);
if (bogus.length) fail(`The llms.txt example names axes that do not exist: ${bogus.join(', ')}.`);
if (bothWays.length) fail(`The llms.txt example lists these as both filled and blank: ${bothWays.join(', ')}.`);

/*
 * The subject is not an axis.
 *
 * index.html keeps it in its own field and puts it at the head of the prompt,
 * ahead of the seventeen axis values. llms.txt described the axes and never
 * mentioned it, so an agent with a character to place had nowhere to put it —
 * one wrote the character into `figure`, which is for how a body is arranged,
 * not for whose body it is. A protocol that omits a field the app has will be
 * filled in by guesswork at the nearest-looking axis.
 */
if (!/^### Subject, then axes$/m.test(llms) || !/Never put the subject in an axis/i.test(llmsFlat)) {
  fail('llms.txt does not establish that the subject is separate from the axes and comes first.');
}
for (const [name, url] of Object.entries(MIRRORS)) {
  if (!llms.includes(url)) fail(`llms.txt does not list the ${name} mirror (${url}).`);
}
if (!html.includes('raw.githubusercontent.com/androotandtheretinue/prompt-forge')) {
  fail('The <head> ai-vocabulary pointer does not mention the mirror, so a truncated fetch on a blocked host finds no alternative.');
}

/*
 * The protocol embedded in index.html must match llms.txt exactly.
 *
 * index.html is the URL people share, so it is the one an agent fetches, and
 * it now carries the protocol rather than a pointer to it. A copy is a thing
 * that drifts — this project deleted dist/ over exactly that — so the copy is
 * generated and compared rather than maintained. Edit llms.txt and run
 * `npm run vocabulary`; never edit the embedded region.
 *
 * It also has to stay early. The whole point is surviving a truncated fetch,
 * and a protocol forty kilobytes into the file would be behind the same wall
 * the vocabulary already sits behind.
 */
/*
 * No text that can lie about what the code does.
 *
 * The comments in this file are deliberately strange, which is fine — a
 * comment is for whoever reads it and this project has opinions about that.
 * Two categories are not fine, and the difference is not taste.
 *
 * Bidirectional overrides (U+202A–U+202E, U+2066–U+2069) reorder how a line
 * *displays* without changing how it *executes*. That is the Trojan Source
 * class: source that reads as one thing to a reviewer and runs as another. It
 * is the exact attack an audit like this exists to refuse.
 *
 * Zero-width and invisible characters (U+200B–U+200D, U+2060, U+FEFF inside
 * the body) hide differences that a reader cannot see and a diff will not
 * explain. Both belong to the same family: characters whose only function is
 * to make the visible text untrustworthy.
 *
 * Every legible script is welcome. Runes, hexagrams, Cyrillic, kana,
 * alchemical sigils and zalgo all render as themselves and are checked by
 * nothing but taste.
 */
const deceptiveChars = [
  ['bidirectional override', /[‪-‮⁦-⁩]/g],
  ['zero-width character', /[​-‍⁠]/g],
  ['stray byte-order mark', /(?!^)﻿/g]
];
for (const [label, pattern] of deceptiveChars) {
  const found = html.match(pattern);
  if (found) {
    const at = html.search(pattern);
    const line = html.slice(0, at).split('\n').length;
    fail(`index.html contains ${found.length} ${label}(s), first at line ${line}. These change how source reads without changing how it runs.`);
  }
}

/*
 * Script tags must balance, including inside comments.
 *
 * A comment here once explained the embed by spelling out a literal opening
 * script tag. Balanced parsers ignore comments and were fine; the regex-based
 * strippers used by extraction pipelines are not, and matched from that text
 * to the next closing tag — taking the protocol with it. The prose broke the
 * thing it described, and nothing rendered differently, so only a count catches
 * it.
 */
const scriptOpens = (html.match(/<script/gi) || []).length;
const scriptCloses = (html.match(/<\/script>/gi) || []).length;
if (scriptOpens !== scriptCloses) {
  fail(`index.html has ${scriptOpens} opening and ${scriptCloses} closing script tags. A stray one — even inside a comment — makes regex-based extractors swallow everything up to the next close.`);
}

const embedded = extractProtocol(html);
if (embedded === null) {
  fail('index.html has no llms.txt embed markers, so a reader of the page alone gets a pointer instead of the protocol.');
} else if (normalize(embedded) !== normalize(llms.trim())) {
  fail('The llms.txt copy embedded in index.html does not match llms.txt. Run `npm run vocabulary`.');
} else {
  /*
   * It also has to stay early — but a byte threshold was measuring the wrong
   * thing, and had to be raised twice by changes that were not regressions.
   * Inline CSS sits above the disclosure and grows whenever the interface does,
   * which the single-file rule guarantees; a ceiling tuned close to that number
   * fails on ordinary work and teaches you to raise it.
   *
   * What actually matters is order. The protocol must come before the board, so
   * a reader that gives up partway through has the instructions rather than the
   * markup for a control panel — and a markdown converter, which strips the
   * head entirely, lands on it within the first page of extracted text however
   * many kilobytes of style preceded it. The byte ceiling stays as a loose
   * backstop against something genuinely absurd.
   */
  const protocolAt = html.indexOf('BEGIN llms.txt');
  const boardAt = html.indexOf('id="categoriesPanel"');
  if (boardAt !== -1 && protocolAt > boardAt) {
    fail('The embedded protocol appears after the category board. It must come first, so a truncated read gets the instructions rather than a control panel.');
  }
  const offsetKb = Buffer.byteLength(html.slice(0, protocolAt), 'utf8') / 1024;
  if (offsetKb > 48) {
    fail(`The embedded protocol starts ${offsetKb.toFixed(0)} kB into index.html, which is further in than any amount of styling explains.`);
  }
}

/*
 * llms.txt argues from two numbers — how large index.html is and how far into
 * it the pools start — and those numbers are the reason it tells readers not to
 * scrape the page. They were wrong on first write (carried over from before the
 * v5.2 expansion) and they grow every time a signal is added. Checked with a
 * tolerance, so ordinary growth passes and genuine staleness does not.
 */
const htmlKb = Buffer.byteLength(html, 'utf8') / 1024;
const poolKb = Buffer.byteLength(html.slice(0, html.indexOf(APP_MARKER)), 'utf8') / 1024;
const claims = [
  { label: 'total size', actual: htmlKb, claimed: (llms.match(/It is a (\d+) kB/) || [])[1] },
  { label: 'pool offset', actual: poolKb, claimed: (llms.match(/begin about (\d+) kB in/) || [])[1] }
];
for (const { label, actual, claimed } of claims) {
  if (claimed === undefined) {
    fail(`llms.txt no longer states the ${label} of index.html in the expected form.`);
  } else if (Math.abs(Number(claimed) - actual) > Math.max(8, actual * 0.1)) {
    fail(`llms.txt claims ${claimed} kB for ${label}; index.html measures ${actual.toFixed(0)} kB.`);
  }
}
if (!/<link\s[^>]*rel=["']alternate["'][^>]*href=["']vocabulary\.json["']/.test(html)) {
  fail('index.html <head> is missing the vocabulary.json pointer that survives truncated fetches.');
}

/*
 * Version strings must agree with package.json.
 *
 * Three of them had drifted independently: the static footer said v4.0, the v5
 * layer overwrote it with a hardcoded v5.1 while PF_VERSION sat at 5.2 two
 * thousand lines above, and the <head> still advertised v4 to every link
 * preview and scraper. Each was written once and never read again, which is the
 * whole failure mode — so they are read here.
 */
const shortVersion = version.replace(/\.\d+$/, '');
const versionClaims = [
  { label: 'PF_VERSION', found: (html.match(/const PF_VERSION = '([^']+)'/) || [])[1], want: shortVersion },
  { label: 'static footer', found: (html.match(/FORGED WITH hop\.e[^<]*?v([\d.]+)/) || [])[1], want: shortVersion },
  { label: 'static header', found: (html.match(/id="optionCountHeader">[^<]*·\s*v([\d.]+)/) || [])[1], want: shortVersion }
];
for (const { label, found, want } of versionClaims) {
  if (found === undefined) fail(`Could not find the ${label} version string in index.html.`);
  else if (found !== want) fail(`${label} says v${found}; package.json is ${version} (expected v${want}).`);
}

/*
 * No agency name on the masthead.
 *
 * The project is called Prompt Forge, and the subtitle — Distributed Axis
 * Randomization & Prompt Assembly — describes what it does. The initials of
 * that phrase spell a federal agency, which is the joke, and the joke works
 * because a reader notices it rather than because the page announces it.
 *
 * Spelling the agency out is what would turn an easter egg into an implied
 * affiliation, so the surfaces a stranger meets first are kept clear of it. The
 * DARPA Forge Card and two of its signal values still carry the word, and are
 * meant to: a card inside a tool reads as a citation, the way a film emulation
 * names a film stock. That is content. This is the masthead.
 */
const brandSurfaces = [
  ['<title>', (html.match(/<title>([^<]*)<\/title>/) || [])[1]],
  ['og:title', (html.match(/og:title["'] content=["']([^"']*)/) || [])[1]],
  ['twitter:title', (html.match(/twitter:title["'] content=["']([^"']*)/) || [])[1]],
  ['static header', (html.match(/id="optionCountHeader">([^<]*)/) || [])[1]],
  ['static footer', (html.match(/<p>(FORGED WITH[^<]*)/) || [])[1]]
];
const brandedWithAgency = brandSurfaces.filter(([, text]) => text && /darpa/i.test(text));
if (brandedWithAgency.length) {
  fail(`These brand surfaces name a federal agency: ${brandedWithAgency.map(([where]) => where).join(', ')}. The subtitle spells it; the masthead should not.`);
}
if (!/Distributed Axis Randomization/i.test(html)) {
  fail('index.html no longer carries the Distributed Axis Randomization & Prompt Assembly subtitle, which is the whole of the naming.');
}

/*
 * The static header's signal count, too.
 *
 * JavaScript rewrites this line on load, so in a browser it is always right and
 * nobody looks at the markup. Markdown converters strip the script, which makes
 * the stale markup the only version a large class of agent ever sees — an
 * outside audit read the live page and reported v4.0 with 2000 options, three
 * releases behind. What no human can see is exactly what needs a check.
 */
const headerCount = (html.match(/id="optionCountHeader">[^<]*·\s*([\d,]+)\s*Options/) || [])[1];
if (headerCount === undefined) {
  fail('The static header no longer states a signal count in the expected form.');
} else if (Number(headerCount.replace(/,/g, '')) !== total) {
  fail(`The static header claims ${headerCount} options; the source holds ${total.toLocaleString()}.`);
}

/*
 * Every signal count stated anywhere in the markup.
 *
 * The description, og:description and twitter:description each carry one, and
 * all three sat two releases behind while the header and footer were being
 * fixed by hand. They live in the first kilobyte, which is the part a
 * truncating fetcher is most likely to keep, so a stale number there is the one
 * most likely to be read. Sweep for the pattern rather than naming each tag,
 * since the next one added would otherwise go unchecked too.
 */
const statedCounts = [...html.matchAll(/([\d,]{4,})\s+signals/gi)]
  .map(match => match[1])
  .filter(value => Number(value.replace(/,/g, '')) !== total);
if (statedCounts.length) {
  fail(`index.html states ${[...new Set(statedCounts)].join(', ')} signals somewhere in its markup; the source holds ${total.toLocaleString()}.`);
}

// The runtime footer must derive its version rather than restate it.
if (/v\d+\.\d+ ·/.test(html.slice(html.indexOf('footer.textContent'), html.indexOf('footer.textContent') + 400))) {
  fail('The runtime footer hardcodes a version instead of interpolating PF_VERSION.');
}

/*
 * Social-card image. A link preview pointing at a 404 is worse than one with no
 * image: the platform renders a broken card rather than a plain one, and the
 * failure is invisible from inside the repository.
 *
 * Only existence and the absolute URL are checked. Whether the picture still
 * looks like the current board cannot be verified here — regenerate it when the
 * board changes.
 */
const cardMatch = html.match(/property=["']og:image["'] content=["']([^"']+)["']/);
if (!cardMatch) {
  fail('index.html declares no og:image, so shared links render without a preview.');
} else {
  const cardUrl = cardMatch[1];
  if (!/^https?:\/\//.test(cardUrl)) {
    fail(`og:image must be an absolute URL; found "${cardUrl}". Scrapers resolve it against their own host.`);
  }
  const cardFile = cardUrl.split('/').pop();
  if (!fs.existsSync(new URL(`../${cardFile}`, import.meta.url))) {
    fail(`og:image points at ${cardFile}, which is not in the repository.`);
  }
  if (!/name=["']twitter:card["'] content=["']summary_large_image["']/.test(html)) {
    fail('An og:image is declared without twitter:card=summary_large_image, so X renders a thumbnail instead of a large card.');
  }
}

if (!process.exitCode) {
  console.log('Prompt Forge audit passed.');
  console.log(`  ${Object.keys(audit.counts).length} axes`);
  console.log(`  ${total.toLocaleString()} unique signals`);
  console.log(`  ${audit.cardCount} valid Forge Cards`);
  console.log(`  ${audit.clusterNames.length} reroll scopes partitioning all ${audit.categoryKeys.length} axes`);
  // The bank, not the total. Reporting 178 under a line about multiples of 16
  // reads as an arithmetic error in the checker rather than a supplement.
  console.log(`  every axis bank sized to a multiple of 16 (medium ${audit.counts.medium - audit.supplement.medium}) + ${audit.supplementTotal} PHOSPHOR`);
  console.log(`  ${blocks.length} inline script blocks, all parsing, no local script or stylesheet dependencies`);
  console.log(`  vocabulary.json and vocabulary.txt match the application`);
  console.log(`  llms.txt carries the protocol, all ${audit.categoryKeys.length} axes, and the mirrors`);
}
