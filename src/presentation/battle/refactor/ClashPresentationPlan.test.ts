import { describe, expect, it } from 'vitest';
import type { BattlePreviewWithClashResult } from '../../../core/preview/BattlePreviewWithClash';
import { buildPlayerActionAnimationPlan } from './RefactorBattleAnimationPlan';
import type { RefactorBattleView } from './RefactorBattleRuntime';
import { buildTargetPreview } from './TargetPreviewPresenter';

function previewFixture(clash?: BattlePreviewWithClashResult['clash']): BattlePreviewWithClashResult {
  return {
    activeActorId: 'rin',
    targetId: 'ghost-fire',
    baseDamage: 8,
    breakBonusDamage: 0,
    specializationBonusDamage: 0,
    finalDamage: 8,
    hpBefore: 52,
    hpAfter: 44,
    lethal: false,
    requestedDelay: 0,
    actualDelay: 0,
    ignoredResilience: 0,
    oboroBonusApplied: false,
    crossedPlayerActorIds: [],
    crossedPlayerWindows: 0,
    actorNextActionAt: 3,
    intentChange: 'none',
    consumedBreakWindowIds: [],
    predictedTimeline: { currentTime: 0, entries: [] },
    clash,
  };
}

function viewWithPreview(preview: RefactorBattleView['preview']): RefactorBattleView {
  return {
    phase: 'TARGET_PREVIEW',
    activeActorId: 'rin',
    timeline: [],
    hand: [{
      instanceId: 'card-1',
      name: '迅切',
      category: 'quick',
      delay: 3,
      targetRule: 'enemy',
      effect: { damage: 8 },
      effectLines: ['傷害 8'],
      selected: true,
    }],
    preview,
    enemyIntents: [{
      enemyId: 'ghost-fire',
      name: '鬼火疾走',
      targetIds: ['rin'],
      damage: 20,
      delay: 5,
      canDelay: true,
      canInterrupt: true,
      canGuard: true,
      canRedirect: true,
      presentationProfile: 'enemy-heavy',
    }],
    vitalsByActorId: {},
    targetableActorIds: ['ghost-fire'],
    canConfirm: true,
    canDispatch: false,
    canResolveEnemy: false,
  };
}

describe('Clash presentation boundary', () => {
  it('exposes only authoritative eligible Clash data in Target Preview', () => {
    const view = buildTargetPreview(previewFixture({
      resolution: {
        eligible: true,
        playerScore: { base: 3, timing: 1, specialization: 1, state: 0, total: 5 },
        enemyScore: { base: 4, timing: 0, specialization: 0, state: 0, total: 4 },
        outcome: 'player-win',
      },
      consequence: { outcome: 'player-win', playerEffectMode: 'full', enemyIntentMode: 'cancel' },
      contestedEnemyId: 'ghost-fire',
      enemyIntentChange: 'canceled',
    }));

    expect(view.clash).toEqual({
      contestedEnemyId: 'ghost-fire',
      outcome: 'player-win',
      playerScore: 5,
      enemyScore: 4,
    });
  });

  it('does not expose a presentation Clash for unavailable resolutions', () => {
    const view = buildTargetPreview(previewFixture({
      resolution: { eligible: false, reason: 'player-clash-disabled' },
    }));
    expect(view.clash).toBeUndefined();
  });

  it('carries the same Clash outcome and authored enemy profile into the player animation plan', () => {
    const preview = buildTargetPreview(previewFixture({
      resolution: {
        eligible: true,
        playerScore: { base: 3, timing: 0, specialization: 0, state: 0, total: 3 },
        enemyScore: { base: 5, timing: 0, specialization: 0, state: 0, total: 5 },
        outcome: 'enemy-win',
      },
      consequence: { outcome: 'enemy-win', playerEffectMode: 'none', enemyIntentMode: 'full' },
      contestedEnemyId: 'ghost-fire',
      enemyIntentChange: 'none',
    }));

    expect(buildPlayerActionAnimationPlan(viewWithPreview(preview))?.clash).toEqual({
      enemyId: 'ghost-fire',
      outcome: 'enemy-win',
      enemyProfileId: 'enemy-heavy',
    });
  });
});
