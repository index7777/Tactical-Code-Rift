import { describe, expect, it } from 'vitest';
import {
  beginActorTurn,
  beginResolving,
  cancelPlayerStep,
  confirmPlayerAction,
  finishResolution,
  previewTarget,
  selectAction,
  waitingForNextActor,
} from './BattleTurnState';

const rin = { actorId: 'rin', team: 'player' as const, nextActionAt: 0, tieBreaker: 0 };
const enemy = { actorId: 'ghost-fire', team: 'enemy' as const, nextActionAt: 3, tieBreaker: 10 };

describe('BattleTurnState', () => {
  it('opens player input only for a player actor', () => {
    expect(beginActorTurn(rin).phase).toBe('PLAYER_IDLE');
    expect(beginActorTurn(enemy).phase).toBe('ENEMY_EXECUTING');
  });

  it('moves through select, preview, execute and resolve without a round-planning phase', () => {
    const idle = beginActorTurn(rin);
    const selected = selectAction(idle, 'quick-1');
    const preview = previewTarget(selected, 'ghost-fire');
    const executing = confirmPlayerAction(preview);
    const resolving = beginResolving(executing);

    expect(selected.phase).toBe('CARD_SELECTED');
    expect(preview).toMatchObject({ phase: 'TARGET_PREVIEW', previewTargetId: 'ghost-fire' });
    expect(executing.phase).toBe('EXECUTING');
    expect(resolving.phase).toBe('RESOLVING');
    expect(finishResolution()).toEqual({ phase: 'WAITING_FOR_NEXT_ACTOR' });
  });

  it('escapes preview to selected card, then selected card to idle', () => {
    const preview = previewTarget(selectAction(beginActorTurn(rin), 'delay-1'), 'ghost-fire');
    const selected = cancelPlayerStep(preview);
    const idle = cancelPlayerStep(selected);

    expect(selected).toMatchObject({ phase: 'CARD_SELECTED', selectedActionId: 'delay-1' });
    expect(selected.previewTargetId).toBeUndefined();
    expect(idle.phase).toBe('PLAYER_IDLE');
    expect(idle.selectedActionId).toBeUndefined();
  });

  it('does not allow selecting a player action during enemy execution', () => {
    expect(() => selectAction(beginActorTurn(enemy), 'quick-1')).toThrow(
      'cannot select action during ENEMY_EXECUTING',
    );
  });

  it('does not allow cancelling after execution starts', () => {
    const executing = confirmPlayerAction(selectAction(beginActorTurn(rin), 'quick-1'));
    expect(cancelPlayerStep(executing)).toBe(executing);
  });

  it('starts with no active actor between unit turns', () => {
    expect(waitingForNextActor()).toEqual({ phase: 'WAITING_FOR_NEXT_ACTOR' });
  });
});
