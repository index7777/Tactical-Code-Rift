import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.PHASE23_BASE_URL ?? 'http://127.0.0.1:4173';
const outputRoot = process.env.PHASE23_OUTPUT_DIR ?? 'artifacts/phase23-presentation-qa';
const viewports = [
  { name: 'desktop-1280x720', width: 1280, height: 720 },
  { name: 'compact-844x390', width: 844, height: 390 },
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function activeSceneKey(page) {
  return page.evaluate(() => window.__TACTICAL_RIFT_GAME__?.scene.getScenes(true)[0]?.scene.key ?? '');
}
async function waitForScene(page, expected, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if ((await activeSceneKey(page)) === expected) return;
    await sleep(100);
  }
  throw new Error(`timed out waiting for scene ${expected}; active=${await activeSceneKey(page)}`);
}
async function hostDataset(page) {
  return page.evaluate(() => ({ ...document.getElementById('game')?.dataset }));
}
async function waitForDataset(page, key, expected, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const dataset = await hostDataset(page);
    if ((dataset[key] ?? '') === expected) return;
    await sleep(100);
  }
  const dataset = await hostDataset(page);
  throw new Error(`timed out waiting for dataset ${key}=${expected}; actual=${dataset[key] ?? ''}`);
}
async function waitForPresentation(page, busy, timeoutMs = 8000) {
  await page.waitForFunction(
    (expected) => Boolean(window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene')?.animationBusy) === expected,
    busy,
    { timeout: timeoutMs },
  );
}
async function screenshot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}
async function openBattle(page, battleId = 'battle-1') {
  await page.goto(`${baseUrl}/?qa-battle=${encodeURIComponent(battleId)}`, { waitUntil: 'domcontentloaded' });
  await waitForScene(page, 'RefactorBattleScene');
  await waitForDataset(page, 'qaPhase', 'PLAYER_IDLE');
  await sleep(180);
}

async function forceCardToHand(page, definitionId) {
  return page.evaluate((requestedId) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const runtime = scene?.runtime;
    const controller = runtime?.controller;
    const deck = controller?.deckState;
    if (!scene || !runtime || !controller || !deck) throw new Error('battle internals unavailable for card QA');
    const piles = [deck.hand, deck.drawPile, deck.discardPile];
    let located;
    for (const pile of piles) {
      const index = pile.findIndex((card) => card.definition.id === requestedId);
      if (index >= 0) { located = { pile, index, card: pile[index] }; break; }
    }
    if (!located) throw new Error(`QA card definition not found: ${requestedId}`);
    if (located.pile !== deck.hand) {
      const displaced = deck.hand[0];
      deck.hand[0] = located.card;
      located.pile[located.index] = displaced;
    }
    scene.render();
    return {
      instanceId: located.card.instanceId,
      targetRule: located.card.definition.targetRule,
      category: located.card.definition.category,
    };
  }, definitionId);
}

async function preparePlayerCard(page, definitionId, clashOutcome) {
  const card = await forceCardToHand(page, definitionId);
  return page.evaluate(({ instanceId, targetRule, outcome }) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const runtime = scene?.runtime;
    const controller = runtime?.controller;
    if (!scene || !runtime || !controller) throw new Error('battle internals unavailable');
    runtime.selectCard(instanceId);
    let targetId;
    if (targetRule === 'enemy' || targetRule === 'ally' || targetRule === 'any-ally') {
      targetId = runtime.view().targetableActorIds[0];
      if (!targetId) throw new Error(`no legal target for ${instanceId}`);
      runtime.previewTarget(targetId);
    }
    if (outcome) {
      if (!targetId || !controller.previewResult) throw new Error('Clash QA requires a resolved target preview');
      const enemyIntent = controller.battleState.intentByEnemyId[targetId];
      if (!enemyIntent) throw new Error(`Clash QA target has no public Intent: ${targetId}`);
      const consequenceByOutcome = {
        'player-win': { outcome: 'player-win', playerEffectMode: 'full', enemyIntentMode: 'cancel' },
        draw: { outcome: 'draw', playerEffectMode: 'half', enemyIntentMode: 'half' },
        'enemy-win': { outcome: 'enemy-win', playerEffectMode: 'none', enemyIntentMode: 'full' },
      };
      const totals = outcome === 'player-win' ? [7, 6] : outcome === 'draw' ? [6, 6] : [5, 6];
      const score = (total) => ({ base: total, timing: 0, specialization: 0, state: 0, total });
      controller.previewResult.clash = {
        resolution: { eligible: true, playerScore: score(totals[0]), enemyScore: score(totals[1]), outcome },
        consequence: consequenceByOutcome[outcome],
        contestedEnemyId: targetId,
        enemyIntentBefore: { ...enemyIntent, targetIds: [...enemyIntent.targetIds], statusEffects: [...enemyIntent.statusEffects] },
        enemyIntentAfter: { ...enemyIntent, targetIds: [...enemyIntent.targetIds], statusEffects: [...enemyIntent.statusEffects] },
        enemyIntentChange: 'none',
      };
    }
    scene.render();
    return { targetId };
  }, { instanceId: card.instanceId, targetRule: card.targetRule, outcome: clashOutcome });
}

async function runPlayerProfile(page, dir, definitionId, expectedProfile, captureDelayMs) {
  await openBattle(page, 'battle-1');
  await preparePlayerCard(page, definitionId);
  const started = await page.evaluate(() => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const plan = scene ? window.__TACTICAL_RIFT_GAME__ && scene.runtime ? scene.runtime.view() : undefined;
    scene.playPlayerAction(plan);
    return Boolean(scene.animationBusy);
  });
  if (!started) throw new Error(`${expectedProfile} did not enter presentation motion`);
  await sleep(captureDelayMs);
  await screenshot(page, dir, `profile-${expectedProfile}`);
  await waitForPresentation(page, false);
  return { definitionId, expectedProfile };
}

async function forceEnemyPresentation(page, dir, { battleId, enemyId, intent, deadActorId, captureDelayMs, name }) {
  await openBattle(page, battleId);
  const prepared = await page.evaluate(({ requestedEnemyId, qaIntent, deadId }) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const runtime = scene?.runtime;
    const controller = runtime?.controller;
    if (!scene || !runtime || !controller) throw new Error('battle internals unavailable for enemy presentation QA');
    if (deadId && controller.battleState.vitalsByActorId[deadId]) controller.battleState.vitalsByActorId[deadId].hp = 0;
    const enemyEntry = controller.battleState.timeline.entries.find((entry) => entry.actorId === requestedEnemyId);
    if (!enemyEntry) throw new Error(`enemy timeline entry missing: ${requestedEnemyId}`);
    if (qaIntent) {
      controller.battleState.intentByEnemyId[requestedEnemyId] = {
        ...qaIntent,
        targetIds: [...qaIntent.targetIds],
        statusEffects: [...qaIntent.statusEffects],
      };
    }

    // Enter ENEMY_EXECUTING through the real controller transition instead of assigning
    // that phase directly. This keeps RefactorBattleRuntime.canResolveEnemy authoritative.
    for (const entry of controller.battleState.timeline.entries) {
      if (entry.actorId === requestedEnemyId) entry.nextActionAt = -1000;
    }
    controller.turnState = { phase: 'WAITING_FOR_NEXT_ACTOR' };
    const transitioned = runtime.startNextActor();
    if (transitioned.phase !== 'ENEMY_EXECUTING' || transitioned.activeActorId !== requestedEnemyId || !transitioned.canResolveEnemy) {
      throw new Error(`could not enter authoritative enemy execution: phase=${transitioned.phase} actor=${transitioned.activeActorId ?? 'none'} canResolve=${transitioned.canResolveEnemy}`);
    }

    scene.__phase23ContactCount = 0;
    scene.__phase23ReactionTargets = [];
    const originalContact = scene.playEnemyVisualContact.bind(scene);
    const originalReaction = scene.playTargetReaction.bind(scene);
    scene.playEnemyVisualContact = (plan) => {
      scene.__phase23ContactCount += 1;
      return originalContact(plan);
    };
    scene.playTargetReaction = (targetId) => {
      if (targetId) scene.__phase23ReactionTargets.push(targetId);
      return originalReaction(targetId);
    };
    scene.render();
    const view = runtime.view();
    const publicIntent = view.enemyIntents.find((candidate) => candidate.enemyId === requestedEnemyId);
    scene.playEnemyAction(view);
    return {
      profileId: publicIntent?.presentationProfile,
      targetIds: publicIntent?.targetIds ?? [],
      started: Boolean(scene.animationBusy),
    };
  }, { requestedEnemyId: enemyId, qaIntent: intent, deadId: deadActorId });
  if (!prepared.started) throw new Error(`${name} did not enter presentation motion`);
  await sleep(captureDelayMs);
  await screenshot(page, dir, name);
  await waitForPresentation(page, false);
  const observed = await page.evaluate(() => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    return {
      contactCount: scene.__phase23ContactCount ?? 0,
      reactionTargets: [...(scene.__phase23ReactionTargets ?? [])],
      inputEnabled: scene.input.enabled,
    };
  });
  return { ...prepared, ...observed };
}

async function runActionProfiles(page, dir, report) {
  const playerCases = [
    ['qa-quick-cut', 'quick-melee', 210],
    ['qa-heavy-cleave', 'heavy-melee', 330],
    ['qa-guard-stance', 'guard', 220],
    ['qa-disrupt-delay', 'disruption', 230],
    ['qa-break-imbalance', 'break', 280],
  ];
  const player = [];
  for (const args of playerCases) player.push(await runPlayerProfile(page, dir, ...args));

  const enemyLight = await forceEnemyPresentation(page, dir, {
    battleId: 'battle-1', enemyId: 'wet-corpse', captureDelayMs: 300, name: 'profile-enemy-light',
  });
  if (enemyLight.profileId !== 'enemy-light') throw new Error(`enemy-light profile mismatch: ${enemyLight.profileId}`);

  const enemyHeavy = await forceEnemyPresentation(page, dir, {
    battleId: 'boss-1', enemyId: 'rain-boss', captureDelayMs: 470, name: 'profile-enemy-heavy',
    intent: {
      id: 'phase23:boss-heavy', enemyId: 'rain-boss', kind: 'normal', name: '雨斬', targetIds: ['rin'],
      damage: 12, delay: 5, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'enemy-heavy',
    },
  });
  if (enemyHeavy.profileId !== 'enemy-heavy') throw new Error(`enemy-heavy profile mismatch: ${enemyHeavy.profileId}`);

  const bossSignature = await forceEnemyPresentation(page, dir, {
    battleId: 'boss-1', enemyId: 'rain-boss', captureDelayMs: 650, name: 'profile-boss-signature',
    intent: {
      id: 'phase23:boss-signature', enemyId: 'rain-boss', kind: 'normal', name: '終雨', targetIds: ['rin'],
      damage: 18, delay: 8, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'boss-signature',
    },
  });
  if (bossSignature.profileId !== 'boss-signature') throw new Error(`boss-signature profile mismatch: ${bossSignature.profileId}`);
  report.actionProfiles = { player, enemyLight, enemyHeavy, bossSignature };
}

async function runClashOutcomes(page, dir, report) {
  const cases = [['player-win', 'qa-quick-cut'], ['draw', 'qa-quick-feint'], ['enemy-win', 'qa-heavy-cleave']];
  const results = [];
  for (const [outcome, definitionId] of cases) {
    await openBattle(page, 'battle-1');
    const prepared = await preparePlayerCard(page, definitionId, outcome);
    const started = await page.evaluate(() => {
      const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
      scene.playPlayerAction(scene.runtime.view());
      return Boolean(scene.animationBusy);
    });
    if (!started) throw new Error(`${outcome} Clash did not enter presentation motion`);
    await sleep(definitionId === 'qa-heavy-cleave' ? 430 : 340);
    await screenshot(page, dir, `clash-${outcome}`);
    await waitForPresentation(page, false);
    const inputEnabled = await page.evaluate(() => window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene')?.input?.enabled === true);
    if (!inputEnabled) throw new Error(`${outcome} Clash did not restore input`);
    results.push({ outcome, definitionId, contestedEnemyId: prepared.targetId, inputEnabled });
  }
  report.clash = results;
}

async function runBossChecks(page, dir, report) {
  const doubleHit = await forceEnemyPresentation(page, dir, {
    battleId: 'boss-1', enemyId: 'rain-boss', captureDelayMs: 520, name: 'boss-mountain-shadow-double-hit',
    intent: {
      id: 'phase23:mountain-shadow-blades', enemyId: 'rain-boss', kind: 'normal', name: '山影連刃', targetIds: ['rin'],
      damage: 6, hitCount: 2, delay: 5, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'enemy-heavy',
    },
  });
  if (doubleHit.contactCount !== 2) throw new Error(`山影連刃 expected 2 contacts; got ${doubleHit.contactCount}`);

  const aoeTargets = ['rin', 'chikage', 'mo'];
  const aoe = await forceEnemyPresentation(page, dir, {
    battleId: 'boss-1', enemyId: 'rain-boss', deadActorId: 'oboro', captureDelayMs: 500, name: 'boss-downpour-aoe',
    intent: {
      id: 'phase23:downpour-sweep', enemyId: 'rain-boss', kind: 'normal', name: '驟雨橫掃', targetIds: aoeTargets,
      damage: 8, delay: 7, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'enemy-heavy',
    },
  });
  const actual = [...new Set(aoe.reactionTargets)].sort();
  const expected = [...aoeTargets].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`AoE reactions mismatch: expected ${expected}; got ${actual}`);
  if (actual.includes('oboro')) throw new Error('dead/non-target oboro reacted to AoE');
  report.boss = { doubleHit, aoe };
}

async function runDeadSlot(page, dir, report) {
  await openBattle(page, 'battle-3-upper');
  const before = await page.evaluate(() => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    return Object.fromEntries([...scene.actorSprites.entries()]
      .filter(([actorId]) => scene.enemySpawnIds.includes(actorId))
      .map(([actorId, sprite]) => [actorId, { x: sprite.x, y: sprite.y }]));
  });
  await screenshot(page, dir, 'formation-dead-slot-before');
  const enemyIds = Object.keys(before);
  if (enemyIds.length < 4) throw new Error(`dead-slot QA expected four enemies; got ${enemyIds.length}`);
  const deadId = enemyIds[1];
  const after = await page.evaluate((targetId) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    scene.runtime.controller.battleState.vitalsByActorId[targetId].hp = 0;
    scene.render();
    return Object.fromEntries([...scene.actorSprites.entries()]
      .filter(([actorId]) => scene.enemySpawnIds.includes(actorId))
      .map(([actorId, sprite]) => [actorId, { x: sprite.x, y: sprite.y }]));
  }, deadId);
  await screenshot(page, dir, 'formation-dead-slot-after');
  if (after[deadId]) throw new Error(`dead enemy still rendered: ${deadId}`);
  for (const [actorId, position] of Object.entries(before)) {
    if (actorId === deadId) continue;
    const next = after[actorId];
    if (!next || next.x !== position.x || next.y !== position.y) throw new Error(`survivor slot moved after death: ${actorId}`);
  }
  report.deadSlot = { deadId, before, after };
}

async function runViewport(browser, viewport) {
  const dir = path.join(outputRoot, viewport.name);
  await fs.mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  const report = { viewport, actionProfiles: undefined, clash: undefined, boss: undefined, deadSlot: undefined, consoleErrors, pageErrors };
  try {
    await runActionProfiles(page, dir, report);
    await runClashOutcomes(page, dir, report);
    await runBossChecks(page, dir, report);
    await runDeadSlot(page, dir, report);
    if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
    report.passed = true;
  } catch (error) {
    report.passed = false;
    report.failure = error instanceof Error ? error.stack ?? error.message : String(error);
    await screenshot(page, dir, 'failure').catch(() => {});
  } finally {
    await fs.writeFile(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
    await page.close();
  }
  return report;
}

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
const reports = [];
try {
  for (const viewport of viewports) reports.push(await runViewport(browser, viewport));
} finally {
  await browser.close();
}
await fs.writeFile(path.join(outputRoot, 'summary.json'), JSON.stringify(reports, null, 2));
const failures = reports.filter((report) => report.passed !== true);
if (failures.length) throw new Error(`Phase 23 presentation QA failed: ${failures.map((r) => `${r.viewport.name}: ${r.failure}`).join(' | ')}`);
console.log(`Phase 23 presentation QA passed for ${reports.map((r) => r.viewport.name).join(', ')}`);
