import { describe, expect, it } from 'vitest';
import {
  chooseDemoUpgradeReward,
  createDemoCardUpgradeRunState,
  offerDemoUpgradeRewardAfterVictory,
} from '../../core/cards/DemoCardUpgradeRunState';
import { storyEncounter } from '../../core/route/EncounterCatalog';
import { RAIL_HALT_STAGE_PROFILE } from '../../presentation/battle/refactor/BattleStageProfile';
import {
  actionPresentationProfile,
  actionPresentationProfileIds,
  type AnimatedActionPresentationProfile,
} from '../../presentation/battle/refactor/ActionPresentationSequencer';
import { decisionCameraTarget } from '../../presentation/battle/refactor/DecisionCameraPolicy';
import { refactorViewportScaleMode } from '../../presentation/battle/refactor/RefactorBattleViewportPolicy';
import { createEncounterBattleBootstrap } from './createEncounterBattleBootstrap';

const CANONICAL_ENCOUNTERS = [
  ['battle-1', 2],
  ['battle-2-upper', 3],
  ['battle-2-lower', 3],
  ['battle-3-upper', 4],
  ['battle-3-lower', 4],
  ['elite-1', 3],
  ['boss-1', 3],
] as const;

const EXPECTED_PRESENTATION_PROFILES: readonly AnimatedActionPresentationProfile[] = [
  'quick-melee',
  'heavy-melee',
  'guard',
  'disruption',
  'break',
  'enemy-light',
  'enemy-heavy',
  'boss-signature',
];

function allDefinitions(nodeId: string, ownedUpgradeIds: readonly ('quick-v1' | 'heavy-v1' | 'guard-v1')[] = []) {
  const deck = createEncounterBattleBootstrap(nodeId, 20260822, ownedUpgradeIds).controller.deck();
  return [...deck.hand, ...deck.drawPile, ...deck.discardPile].map((instance) => instance.definition);
}

function definition(nodeId: string, id: string, ownedUpgradeIds: readonly ('quick-v1' | 'heavy-v1' | 'guard-v1')[] = []) {
  const found = allDefinitions(nodeId, ownedUpgradeIds).find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing card definition ${id} in ${nodeId}`);
  return found;
}

function runProgression(branch3Id: 'battle-3-upper' | 'battle-3-lower') {
  let progression = createDemoCardUpgradeRunState();
  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, 'battle-1'),
    'quick-v1',
  );
  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, branch3Id),
    'guard-v1',
  );
  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, 'elite-1'),
    'heavy-v1',
  );
  return progression;
}

function expectCameraWithinStage(target: ReturnType<typeof decisionCameraTarget>): void {
  expect(target).toBeDefined();
  if (!target) return;
  const bounds = RAIL_HALT_STAGE_PROFILE.cameraSafeBounds;
  expect(target.x).toBeGreaterThanOrEqual(bounds.x);
  expect(target.x).toBeLessThanOrEqual(bounds.x + bounds.width);
  expect(target.y).toBeGreaterThanOrEqual(bounds.y);
  expect(target.y).toBeLessThanOrEqual(bounds.y + bounds.height);
}

describe('Area 01 full QA matrix', () => {
  it('boots every canonical battle node with the canonical four-player / enemy matrix', () => {
    for (const [nodeId, expectedEnemyCount] of CANONICAL_ENCOUNTERS) {
      const encounter = storyEncounter(nodeId);
      expect(encounter?.nodeId).toBe(nodeId);
      expect(encounter?.enemies).toHaveLength(expectedEnemyCount);

      const battle = createEncounterBattleBootstrap(nodeId, 20260822, []).controller.battle();
      const playerIds = battle.timeline.entries
        .filter((entry) => entry.team === 'player')
        .map((entry) => entry.actorId);
      const enemyIds = battle.timeline.entries
        .filter((entry) => entry.team === 'enemy')
        .map((entry) => entry.actorId);

      expect(playerIds).toEqual(['rin', 'chikage', 'oboro', 'mo']);
      expect(enemyIds).toEqual(encounter?.enemies);
      expect(enemyIds).toHaveLength(expectedEnemyCount);
      for (const actorId of [...playerIds, ...enemyIds]) {
        const vitals = battle.vitalsByActorId[actorId];
        expect(vitals?.hp).toBeGreaterThan(0);
        expect(vitals?.maxHp).toBeGreaterThan(0);
      }
    }
  });

  it('keeps authored Elite and Boss cutovers plus Boss multi-hit data in the production matrix', () => {
    const elite = createEncounterBattleBootstrap('elite-1', 20260822, []).controller.battle();
    expect(elite.vitalsByActorId['rain-warrior']).toMatchObject({ hp: 120, maxHp: 120 });
    expect(elite.resilienceByEnemyId['rain-warrior']).toMatchObject({ base: 1, temporary: 0 });

    const bossBootstrap = createEncounterBattleBootstrap('boss-1', 20260822, []);
    const boss = bossBootstrap.controller.battle();
    expect(boss.vitalsByActorId['rain-boss']).toMatchObject({ hp: 240, maxHp: 240 });
    expect(boss.resilienceByEnemyId['rain-boss']).toMatchObject({ base: 1, temporary: 0 });

    const phase1 = { ...boss, vitalsByActorId: { ...boss.vitalsByActorId } };
    phase1.vitalsByActorId['rain-boss'] = { actorId: 'rain-boss', hp: 240, maxHp: 240 };
    const next = bossBootstrap.enemyIntentProvider('rain-boss', phase1);
    expect(next.name).toBe('山影連刃');
    expect(next).toMatchObject({ damage: 6, hitCount: 2 });
  });

  it('keeps the three reward milestones bounded and carries three upgrades into Boss entry on either branch', () => {
    for (const branch3Id of ['battle-3-upper', 'battle-3-lower'] as const) {
      const progression = runProgression(branch3Id);
      expect(progression.ownedUpgradeIds).toEqual(['quick-v1', 'guard-v1', 'heavy-v1']);
      expect(progression.claimedMilestones).toEqual([
        'after-battle-1',
        'after-battle-3',
        'after-elite-1',
      ]);
      expect(offerDemoUpgradeRewardAfterVictory(progression, 'boss-1')).toEqual(progression);

      const upgrades = progression.ownedUpgradeIds as readonly ('quick-v1' | 'heavy-v1' | 'guard-v1')[];
      expect(definition('boss-1', 'qa-quick-cut', upgrades).effect.damage).toBe(10);
      expect(definition('boss-1', 'qa-guard-stance', upgrades).effect.guardCap).toBe(11);
      expect(definition('boss-1', 'qa-heavy-cleave', upgrades).effect.damage).toBe(21);
    }
  });

  it('keeps all eight reusable action presentation profiles available', () => {
    expect(actionPresentationProfileIds()).toEqual(EXPECTED_PRESENTATION_PROFILES);
    for (const profileId of EXPECTED_PRESENTATION_PROFILES) {
      const profile = actionPresentationProfile(profileId);
      expect(profile.id).toBe(profileId);
      expect(profile.cameraZoom).toBeGreaterThanOrEqual(1);
      expect(profile.actorScale).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps both required responsive viewport classes and legal decision-camera framing', () => {
    expect(refactorViewportScaleMode(1280, 720)).toBe('COVER');
    expect(refactorViewportScaleMode(844, 390)).toBe('FIT');

    const activeActor = { x: 410, y: 464 };
    const selectedTarget = { x: 930, y: 408 };
    const peek = decisionCameraTarget({ handState: 'PEEK', activeActor });
    const focus = decisionCameraTarget({ handState: 'FOCUS', activeActor });
    const targeting = decisionCameraTarget({ handState: 'TARGETING', activeActor, selectedTarget });

    expect(peek).toMatchObject({ mode: 'PEEK', zoom: 1.05 });
    expect(focus).toMatchObject({ mode: 'FOCUS', zoom: 1.08 });
    expect(targeting).toMatchObject({ mode: 'TARGETING', zoom: 1.12 });
    expectCameraWithinStage(peek);
    expectCameraWithinStage(focus);
    expectCameraWithinStage(targeting);
  });
});
