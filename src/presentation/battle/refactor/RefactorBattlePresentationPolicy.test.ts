import { describe, expect, it } from 'vitest';
import {
  actorDisplayName,
  autoAdvanceAction,
  categoryDisplayName,
  phaseDisplayName,
  targetAffordance,
  targetRuleDisplayName,
} from './RefactorBattlePresentationPolicy';

describe('RefactorBattlePresentationPolicy', () => {
  it('uses Chinese display names without changing internal ids', () => {
    expect(actorDisplayName('rin')).toBe('凜');
    expect(actorDisplayName('chikage')).toBe('千景');
    expect(actorDisplayName('oboro')).toBe('朧');
    expect(actorDisplayName('mo')).toBe('紅葉');
    expect(actorDisplayName('ghost-fire')).toBe('提燈童子');
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
    expect(targetRuleDisplayName('any-ally')).toBe('任一友方');
  });

  it('distinguishes legal single-target candidates from the selected preview target', () => {
    expect(targetAffordance(true, true, false)).toBe('CANDIDATE');
    expect(targetAffordance(true, true, true)).toBe('SELECTED');
    expect(targetAffordance(true, false, false)).toBe('DEFAULT');
    expect(targetAffordance(false, true, true)).toBe('DISABLED');
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
