import { describe, expect, it } from 'vitest';
import {
  actorDisplayName,
  autoAdvanceAction,
  cardTargetDisplayName,
  categoryDisplayName,
  phaseDisplayName,
  shouldShowActorRing,
  targetAffordance,
  targetRuleDisplayName,
} from './RefactorBattlePresentationPolicy';

describe('RefactorBattlePresentationPolicy', () => {
  it('uses Chinese display names without changing internal ids', () => {
    expect(actorDisplayName('rin')).toBe('凜');
    expect(actorDisplayName('chikage')).toBe('千景');
    expect(actorDisplayName('oboro')).toBe('朧');
    expect(actorDisplayName('mo')).toBe('紅葉');
    expect(actorDisplayName('lantern-child')).toBe('提燈童');
    expect(actorDisplayName('unknown-id')).toBe('unknown-id');
  });

  it('localizes card category and target rule labels', () => {
    expect(categoryDisplayName('quick')).toBe('迅擊');
    expect(categoryDisplayName('heavy')).toBe('重擊');
    expect(categoryDisplayName('guard')).toBe('守勢');
    expect(categoryDisplayName('disruption')).toBe('擾亂');
    expect(categoryDisplayName('break')).toBe('破勢');
    expect(targetRuleDisplayName('enemy')).toBe('敵方');
    expect(targetRuleDisplayName('self')).toBe('自身');
    expect(targetRuleDisplayName('any-ally')).toBe('友方');
  });

  it('shows guard target copy from actual actor targetability', () => {
    expect(cardTargetDisplayName('any-ally', 'guard', 'rin')).toBe('自身');
    expect(cardTargetDisplayName('any-ally', 'guard', 'oboro')).toBe('自身');
    expect(cardTargetDisplayName('any-ally', 'guard', 'chikage')).toBe('友方');
    expect(cardTargetDisplayName('self', 'guard', 'rin')).toBe('自身');
  });

  it('distinguishes legal single-target candidates from the selected preview target', () => {
    expect(targetAffordance(true, true, false)).toBe('CANDIDATE');
    expect(targetAffordance(true, true, true)).toBe('SELECTED');
    expect(targetAffordance(true, false, false)).toBe('DEFAULT');
    expect(targetAffordance(false, true, true)).toBe('DISABLED');
  });

  it('reserves the underfoot marker for active-actor focus, not target candidates', () => {
    expect(shouldShowActorRing('DEFAULT', false)).toBe(false);
    expect(shouldShowActorRing('DISABLED', false)).toBe(false);
    expect(shouldShowActorRing('DEFAULT', true)).toBe(true);
    expect(shouldShowActorRing('CANDIDATE', false)).toBe(false);
    expect(shouldShowActorRing('SELECTED', false)).toBe(false);
  });

  it('auto-advances only non-player-decision states', () => {
    expect(autoAdvanceAction('WAITING_FOR_NEXT_ACTOR', false)).toBe('START_NEXT_ACTOR');
    expect(autoAdvanceAction('ENEMY_EXECUTING', true)).toBe('RESOLVE_ENEMY');
    expect(autoAdvanceAction('PLAYER_IDLE', false)).toBe('NONE');
    expect(autoAdvanceAction('CARD_SELECTED', false)).toBe('NONE');
    expect(autoAdvanceAction('TARGET_PREVIEW', false)).toBe('NONE');
  });

  it('localizes player-facing phase labels', () => {
    expect(phaseDisplayName('PLAYER_IDLE')).toBe('等待指令');
    expect(phaseDisplayName('ENEMY_EXECUTING')).toBe('敵方行動中');
  });
});
