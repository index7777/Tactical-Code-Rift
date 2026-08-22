import { describe, expect, it } from 'vitest';
import {
  chooseDemoUpgradeReward,
  createDemoCardUpgradeRunState,
  offerDemoUpgradeRewardAfterVictory,
} from '../../core/cards/DemoCardUpgradeRunState';
import { refactorViewportScaleMode } from '../../presentation/battle/refactor/RefactorBattleViewportPolicy';
import {
  clearDemoCardUpgradeEncounterHandoff,
  prepareDemoCardUpgradeEncounterHandoff,
} from './DemoCardUpgradeEncounterHandoff';
import { createEncounterBattleBootstrap } from './createEncounterBattleBootstrap';

function definitionsFor(nodeId: string, ownedUpgradeIds: readonly string[]) {
  prepareDemoCardUpgradeEncounterHandoff(ownedUpgradeIds);
  const deck = createEncounterBattleBootstrap(nodeId).controller.deck();
  return [...deck.hand, ...deck.drawPile, ...deck.discardPile].map((card) => card.definition);
}

function card(definitions: ReturnType<typeof definitionsFor>, id: string) {
  const found = definitions.find((definition) => definition.id === id);
  if (!found) throw new Error(`missing card definition: ${id}`);
  return found;
}

function runBranch(battle2Id: string, battle3Id: string) {
  clearDemoCardUpgradeEncounterHandoff();
  let progression = createDemoCardUpgradeRunState();

  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, 'battle-1'),
    'quick-v1',
  );
  const battle2 = definitionsFor(battle2Id, progression.ownedUpgradeIds);
  expect(card(battle2, 'qa-quick-cut').effect.damage).toBe(10);
  expect(offerDemoUpgradeRewardAfterVictory(progression, battle2Id)).toEqual(progression);

  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, battle3Id),
    'guard-v1',
  );
  const elite = definitionsFor('elite-1', progression.ownedUpgradeIds);
  expect(card(elite, 'qa-quick-cut').effect.damage).toBe(10);
  expect(card(elite, 'qa-guard-stance').effect.guardCap).toBe(11);

  progression = chooseDemoUpgradeReward(
    offerDemoUpgradeRewardAfterVictory(progression, 'elite-1'),
    'heavy-v1',
  );
  const boss = definitionsFor('boss-1', progression.ownedUpgradeIds);
  expect(progression.ownedUpgradeIds).toEqual(['quick-v1', 'guard-v1', 'heavy-v1']);
  expect(card(boss, 'qa-quick-cut').effect.damage).toBe(10);
  expect(card(boss, 'qa-guard-stance').effect.guardCap).toBe(11);
  expect(card(boss, 'qa-heavy-cleave').effect.damage).toBe(21);
  expect(offerDemoUpgradeRewardAfterVictory(progression, 'boss-1')).toEqual(progression);

  const directBaseline = createEncounterBattleBootstrap('battle-1').controller.deck();
  const baselineDefinitions = [...directBaseline.hand, ...directBaseline.drawPile, ...directBaseline.discardPile]
    .map((instance) => instance.definition);
  expect(card(baselineDefinitions, 'qa-quick-cut').effect.damage).toBe(8);

  return progression;
}

describe('Area 01 Demo progression regression', () => {
  it('keeps the upper branch reward and encounter handoff coherent through Boss entry', () => {
    expect(runBranch('battle-2-upper', 'battle-3-upper').claimedMilestones).toEqual([
      'after-battle-1',
      'after-battle-3',
      'after-elite-1',
    ]);
  });

  it('keeps the lower branch reward and encounter handoff coherent through Boss entry', () => {
    expect(runBranch('battle-2-lower', 'battle-3-lower').claimedMilestones).toEqual([
      'after-battle-1',
      'after-battle-3',
      'after-elite-1',
    ]);
  });

  it('locks the two required viewport classes to legal stable scale modes', () => {
    expect(refactorViewportScaleMode(1280, 720)).toBe('COVER');
    expect(refactorViewportScaleMode(844, 390)).toBe('FIT');
  });
});
