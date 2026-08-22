import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.PHASE23_BASE_URL ?? 'http://127.0.0.1:4173';
const outputRoot = process.env.PHASE23_OUTPUT_DIR ?? 'artifacts/phase23-browser-qa';
const viewports = [
  { name: 'desktop-1280x720', width: 1280, height: 720 },
  { name: 'compact-844x390', width: 844, height: 390 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function activeSceneKey(page) {
  return page.evaluate(() => {
    const game = window.__TACTICAL_RIFT_GAME__;
    return game?.scene.getScenes(true)[0]?.scene.key ?? '';
  });
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
    if ((dataset[key] ?? '') === expected) return dataset;
    await sleep(100);
  }
  const dataset = await hostDataset(page);
  throw new Error(`timed out waiting for dataset ${key}=${expected}; actual=${dataset[key] ?? ''}`);
}

async function waitForPresentation(page, busy, timeoutMs = 5000) {
  await page.waitForFunction(
    (expected) => {
      const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
      return Boolean(scene?.animationBusy) === expected;
    },
    busy,
    { timeout: timeoutMs },
  );
}

async function logicalToPage(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas bounding box unavailable');
  return {
    x: box.x + (x / 1280) * box.width,
    y: box.y + (y / 720) * box.height,
  };
}

async function clickLogical(page, x, y) {
  const p = await logicalToPage(page, x, y);
  await page.mouse.click(p.x, p.y);
}

async function screenshot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

function rewardFirstChoiceX(choiceCount) {
  const gap = 142;
  return 640 - ((choiceCount - 1) * gap) / 2;
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
    if (!scene || !runtime || !controller || !deck) throw new Error('battle internals unavailable for presentation QA');

    const piles = [deck.hand, deck.drawPile, deck.discardPile];
    let located;
    for (const pile of piles) {
      const index = pile.findIndex((card) => card.definition.id === requestedId);
      if (index >= 0) {
        located = { pile, index, card: pile[index] };
        break;
      }
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
      category: located.card.definition.category,
      targetRule: located.card.definition.targetRule,
      definitionId: located.card.definition.id,
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
      if (!targetId || !controller.previewResult) throw new Error('Clash QA requires resolved target preview');
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
        resolution: {
          eligible: true,
          playerScore: score(totals[0]),
          enemyScore: score(totals[1]),
          outcome,
        },
        consequence: consequenceByOutcome[outcome],
        contestedEnemyId: targetId,
        enemyIntentBefore: { ...enemyIntent, targetIds: [...enemyIntent.targetIds], statusEffects: [...enemyIntent.statusEffects] },
        enemyIntentAfter: { ...enemyIntent, targetIds: [...enemyIntent.targetIds], statusEffects: [...enemyIntent.statusEffects] },
        enemyIntentChange: 'none',
      };
    }

    scene.render();
    return { targetId, phase: runtime.view().phase };
  }, { instanceId: card.instanceId, targetRule: card.targetRule, outcome: clashOutcome });
}

async function runPlayerProfileCase(page, dir, definitionId, expectedProfile, captureDelayMs) {
  await openBattle(page, 'battle-1');
  const card = await forceCardToHand(page, definitionId);
  await preparePlayerCard(page, definitionId);
  await page.evaluate(() => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    scene.playPlayerAction(scene.runtime.view());
  });
  await waitForPresentation(page, true);
  await sleep(captureDelayMs);
  await screenshot(page, dir, `profile-${expectedProfile}`);
  await waitForPresentation(page, false);
  const final = await hostDataset(page);
  if (!final.qaPhase) throw new Error(`${expectedProfile} presentation lost battle phase`);
  return { definitionId, category: card.category, expectedProfile, finalPhase: final.qaPhase };
}

async function forceEnemyPresentation(page, { battleId, enemyId, intent, deadActorId, captureDelayMs, name }) {
  await openBattle(page, battleId);
  const prepared = await page.evaluate(({ requestedEnemyId, qaIntent, deadId }) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const runtime = scene?.runtime;
    const controller = runtime?.controller;
    if (!scene || !runtime || !controller) throw new Error('battle internals unavailable for enemy presentation QA');
    if (deadId && controller.battleState.vitalsByActorId[deadId]) {
      controller.battleState.vitalsByActorId[deadId].hp = 0;
    }
    const enemyEntry = controller.battleState.timeline.entries.find((entry) => entry.actorId === requestedEnemyId);
    if (!enemyEntry) throw new Error(`enemy timeline entry missing: ${requestedEnemyId}`);
    if (qaIntent) {
      controller.battleState.intentByEnemyId[requestedEnemyId] = {
        ...qaIntent,
        targetIds: [...qaIntent.targetIds],
        statusEffects: [...qaIntent.statusEffects],
      };
    }
    controller.turnState = { phase: 'ENEMY_EXECUTING', activeActor: { ...enemyEntry } };
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
    return { profileId: publicIntent?.presentationProfile, targetIds: publicIntent?.targetIds ?? [] };
  }, { requestedEnemyId: enemyId, qaIntent: intent, deadId: deadActorId });

  await waitForPresentation(page, true);
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

async function runProgressionPath(page, dir, report) {
  await page.goto(`${baseUrl}/?qa-outcome=victory`, { waitUntil: 'domcontentloaded' });
  await waitForScene(page, 'JourneyScene');
  await sleep(500);
  await screenshot(page, dir, '01-route-depart');

  const nodes = [
    { id: 'battle-1', x: 340, y: 342, reward: 'after-battle-1' },
    { id: 'battle-2-upper', x: 545, y: 220 },
    { id: 'battle-3-upper', x: 750, y: 220, reward: 'after-battle-3' },
    { id: 'elite-1', x: 955, y: 342, reward: 'after-elite-1' },
    { id: 'boss-1', x: 1160, y: 342 },
  ];

  let rewardOrdinal = 0;
  for (const node of nodes) {
    const before = await hostDataset(page);
    if (node.id === 'boss-1') {
      if ((before.qaOwnedUpgrades ?? '').split(',').filter(Boolean).length !== 3) {
        throw new Error(`Boss entry must own exactly three upgrades; got ${before.qaOwnedUpgrades ?? ''}`);
      }
      await screenshot(page, dir, '12-boss-entry-three-upgrades');
    }

    await clickLogical(page, node.x, node.y);
    await waitForScene(page, 'RefactorBattleScene');
    await waitForDataset(page, 'qaBattle', node.id);
    await waitForDataset(page, 'qaOutcome', 'victory');
    await screenshot(page, dir, `battle-result-${node.id}`);

    await clickLogical(page, 640, 390);
    await waitForScene(page, 'JourneyScene');
    await sleep(250);
    const returned = await hostDataset(page);

    if (node.reward) {
      if (returned.qaUpgradeReward !== node.reward) {
        throw new Error(`${node.id} expected reward ${node.reward}; got ${returned.qaUpgradeReward ?? ''}`);
      }
      const choices = (returned.qaUpgradeChoices ?? '').split(',').filter(Boolean);
      if (!choices.length) throw new Error(`${node.id} reward has no choices`);
      rewardOrdinal += 1;
      await screenshot(page, dir, `reward-${rewardOrdinal}-${node.reward}`);
      await clickLogical(page, rewardFirstChoiceX(choices.length), 390);
      await sleep(150);
      const claimed = await hostDataset(page);
      const owned = (claimed.qaOwnedUpgrades ?? '').split(',').filter(Boolean);
      if (owned.length !== rewardOrdinal) {
        throw new Error(`${node.id} expected ${rewardOrdinal} owned upgrades; got ${claimed.qaOwnedUpgrades ?? ''}`);
      }
      if ((claimed.qaUpgradeReward ?? '') !== '') {
        throw new Error(`${node.id} reward modal did not clear after selection`);
      }
    } else if ((returned.qaUpgradeReward ?? '') !== '') {
      throw new Error(`${node.id} must not grant a demo upgrade; got ${returned.qaUpgradeReward}`);
    }
  }

  const final = await hostDataset(page);
  const finalOwned = (final.qaOwnedUpgrades ?? '').split(',').filter(Boolean);
  if (finalOwned.length !== 3) throw new Error(`Boss victory created unexpected upgrade count: ${finalOwned.length}`);
  const areaClear = await page.evaluate(() => window.__TACTICAL_RIFT_GAME__?.registry.get('journey-area01-cleared') === true);
  if (!areaClear) throw new Error('Boss victory did not mark Area 01 cleared');
  await screenshot(page, dir, '13-area-clear');
  report.progression = { ownedUpgradeIds: finalOwned, areaClear };
}

async function runDecisionPresentation(page, dir, report) {
  await page.goto(`${baseUrl}/?qa-battle=battle-1`, { waitUntil: 'domcontentloaded' });
  await waitForScene(page, 'RefactorBattleScene');
  await waitForDataset(page, 'qaPhase', 'PLAYER_IDLE');
  await sleep(250);
  await screenshot(page, dir, '20-decision-peek');

  await clickLogical(page, 248, 680);
  await waitForDataset(page, 'qaPhase', 'CARD_SELECTED');
  await sleep(220);
  await screenshot(page, dir, '21-decision-focus');

  const targetPoint = await page.evaluate(() => {
    const game = window.__TACTICAL_RIFT_GAME__;
    const scene = game?.scene.getScene('RefactorBattleScene');
    const runtime = scene?.runtime;
    const view = runtime?.view?.();
    const targetId = view?.targetableActorIds?.[0];
    const sprite = targetId ? scene?.actorSprites?.get?.(targetId) : undefined;
    return targetId && sprite ? { targetId, x: sprite.x, y: sprite.y } : undefined;
  });
  if (!targetPoint) throw new Error('could not resolve an authoritative target point for decision QA');
  await clickLogical(page, targetPoint.x, targetPoint.y);
  await waitForDataset(page, 'qaPhase', 'TARGET_PREVIEW');
  await sleep(220);
  await screenshot(page, dir, '22-decision-targeting');

  await clickLogical(page, 1110, 626);
  await sleep(180);
  await screenshot(page, dir, '23-action-hidden-handoff');
  await sleep(1800);
  const after = await hostDataset(page);
  if (!after.qaPhase) throw new Error('battle phase disappeared after action presentation');
  await screenshot(page, dir, '24-post-action-return');
  report.decision = { targetId: targetPoint.targetId, finalPhase: after.qaPhase };
}

async function runActionProfiles(page, dir, report) {
  const cases = [
    ['qa-quick-cut', 'quick-melee', 210],
    ['qa-heavy-cleave', 'heavy-melee', 330],
    ['qa-guard-stance', 'guard', 220],
    ['qa-disrupt-delay', 'disruption', 230],
    ['qa-break-imbalance', 'break', 280],
  ];
  const results = [];
  for (const [definitionId, profileId, captureDelayMs] of cases) {
    results.push(await runPlayerProfileCase(page, dir, definitionId, profileId, captureDelayMs));
  }

  const enemyLight = await forceEnemyPresentation(page, {
    battleId: 'battle-1',
    enemyId: 'wet-corpse',
    intent: undefined,
    captureDelayMs: 300,
    name: 'profile-enemy-light',
  });
  if (enemyLight.profileId !== 'enemy-light') {
    throw new Error(`normal enemy expected enemy-light profile; got ${enemyLight.profileId ?? 'none'}`);
  }

  const heavyIntent = {
    id: 'phase23:boss-heavy', enemyId: 'rain-boss', kind: 'normal', name: '雨斬', targetIds: ['rin'],
    damage: 12, delay: 5, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
    statusEffects: [], presentationProfile: 'enemy-heavy',
  };
  const enemyHeavy = await forceEnemyPresentation(page, {
    battleId: 'boss-1', enemyId: 'rain-boss', intent: heavyIntent, captureDelayMs: 470, name: 'profile-enemy-heavy',
  });
  if (enemyHeavy.profileId !== 'enemy-heavy') throw new Error(`Boss heavy profile mismatch: ${enemyHeavy.profileId}`);

  const signatureIntent = {
    id: 'phase23:boss-signature', enemyId: 'rain-boss', kind: 'normal', name: '終雨', targetIds: ['rin'],
    damage: 18, delay: 8, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
    statusEffects: [], presentationProfile: 'boss-signature',
  };
  const bossSignature = await forceEnemyPresentation(page, {
    battleId: 'boss-1', enemyId: 'rain-boss', intent: signatureIntent, captureDelayMs: 650, name: 'profile-boss-signature',
  });
  if (bossSignature.profileId !== 'boss-signature') throw new Error(`Boss signature profile mismatch: ${bossSignature.profileId}`);

  report.actionProfiles = { player: results, enemyLight, enemyHeavy, bossSignature };
}

async function runClashOutcomes(page, dir, report) {
  const cases = [
    ['player-win', 'qa-quick-cut'],
    ['draw', 'qa-quick-feint'],
    ['enemy-win', 'qa-heavy-cleave'],
  ];
  const results = [];
  for (const [outcome, definitionId] of cases) {
    await openBattle(page, 'battle-1');
    await preparePlayerCard(page, definitionId, outcome);
    const targetId = await page.evaluate(() => window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene')?.runtime?.view()?.preview?.clash?.contestedEnemyId);
    if (!targetId) throw new Error(`${outcome} Clash preview did not expose contested enemy`);
    await page.evaluate(() => {
      const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
      scene.playPlayerAction(scene.runtime.view());
    });
    await waitForPresentation(page, true);
    await sleep(definitionId === 'qa-heavy-cleave' ? 430 : 340);
    await screenshot(page, dir, `clash-${outcome}`);
    await waitForPresentation(page, false);
    const inputEnabled = await page.evaluate(() => window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene')?.input?.enabled === true);
    if (!inputEnabled) throw new Error(`${outcome} Clash did not restore input`);
    results.push({ outcome, definitionId, contestedEnemyId: targetId, inputEnabled });
  }
  report.clash = results;
}

async function runBossPresentationChecks(page, dir, report) {
  const doubleHit = await forceEnemyPresentation(page, {
    battleId: 'boss-1', enemyId: 'rain-boss', captureDelayMs: 520, name: 'boss-mountain-shadow-double-hit',
    intent: {
      id: 'phase23:mountain-shadow-blades', enemyId: 'rain-boss', kind: 'normal', name: '山影連刃', targetIds: ['rin'],
      damage: 6, hitCount: 2, delay: 5, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'enemy-heavy',
    },
  });
  if (doubleHit.contactCount !== 2) throw new Error(`山影連刃 expected 2 visual contacts; got ${doubleHit.contactCount}`);

  const aoeTargets = ['rin', 'chikage', 'mo'];
  const aoe = await forceEnemyPresentation(page, {
    battleId: 'boss-1', enemyId: 'rain-boss', deadActorId: 'oboro', captureDelayMs: 500, name: 'boss-downpour-aoe',
    intent: {
      id: 'phase23:downpour-sweep', enemyId: 'rain-boss', kind: 'normal', name: '驟雨橫掃', targetIds: aoeTargets,
      damage: 8, delay: 7, canDelay: true, canInterrupt: true, canGuard: true, canRedirect: true,
      statusEffects: [], presentationProfile: 'enemy-heavy',
    },
  });
  const reactionSet = [...new Set(aoe.reactionTargets)].sort();
  const expectedSet = [...aoeTargets].sort();
  if (JSON.stringify(reactionSet) !== JSON.stringify(expectedSet)) {
    throw new Error(`驟雨橫掃 reaction targets mismatch: expected ${expectedSet.join(',')}; got ${reactionSet.join(',')}`);
  }
  if (reactionSet.includes('oboro')) throw new Error('dead/non-target oboro reacted to AoE');

  report.boss = { doubleHit, aoe };
}

async function runDeadSlotCheck(page, dir, report) {
  await openBattle(page, 'battle-3-upper');
  const before = await page.evaluate(() => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    return Object.fromEntries([...scene.actorSprites.entries()]
      .filter(([actorId]) => scene.enemySpawnIds.includes(actorId))
      .map(([actorId, sprite]) => [actorId, { x: sprite.x, y: sprite.y }]));
  });
  await screenshot(page, dir, 'formation-dead-slot-before');
  const enemyIds = Object.keys(before);
  if (enemyIds.length < 4) throw new Error(`dead-slot QA expected four rendered enemies; got ${enemyIds.length}`);
  const deadId = enemyIds[1];
  const after = await page.evaluate((targetId) => {
    const scene = window.__TACTICAL_RIFT_GAME__?.scene.getScene('RefactorBattleScene');
    const controller = scene.runtime.controller;
    controller.battleState.vitalsByActorId[targetId].hp = 0;
    scene.render();
    return Object.fromEntries([...scene.actorSprites.entries()]
      .filter(([actorId]) => scene.enemySpawnIds.includes(actorId))
      .map(([actorId, sprite]) => [actorId, { x: sprite.x, y: sprite.y }]));
  }, deadId);
  await screenshot(page, dir, 'formation-dead-slot-after');
  if (after[deadId]) throw new Error(`dead enemy sprite still rendered: ${deadId}`);
  for (const [actorId, position] of Object.entries(before)) {
    if (actorId === deadId) continue;
    const next = after[actorId];
    if (!next || next.x !== position.x || next.y !== position.y) {
      throw new Error(`survivor slot moved after ${deadId} death: ${actorId}`);
    }
  }
  report.deadSlot = { deadId, before, after };
}

async function runViewport(browser, viewport) {
  const dir = path.join(outputRoot, viewport.name);
  await fs.mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  const report = {
    viewport,
    progression: undefined,
    decision: undefined,
    actionProfiles: undefined,
    clash: undefined,
    boss: undefined,
    deadSlot: undefined,
    consoleErrors,
    pageErrors,
  };
  try {
    await runProgressionPath(page, dir, report);
    await runDecisionPresentation(page, dir, report);
    await runActionProfiles(page, dir, report);
    await runClashOutcomes(page, dir, report);
    await runBossPresentationChecks(page, dir, report);
    await runDeadSlotCheck(page, dir, report);
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
if (failures.length) {
  throw new Error(`Phase 23 browser QA failed: ${failures.map((report) => `${report.viewport.name}: ${report.failure}`).join(' | ')}`);
}
console.log(`Phase 23 browser QA passed for ${reports.map((report) => report.viewport.name).join(', ')}`);
