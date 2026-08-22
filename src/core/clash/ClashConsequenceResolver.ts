import type { ClashOutcome, ClashResolution } from './ClashResolver';

export type ClashEffectMode = 'full' | 'half' | 'none';
export type ClashIntentMode = 'cancel' | 'half' | 'full';

export interface ClashConsequence {
  outcome: ClashOutcome;
  playerEffectMode: ClashEffectMode;
  enemyIntentMode: ClashIntentMode;
}

const CONSEQUENCES: Record<ClashOutcome, ClashConsequence> = {
  'player-win': {
    outcome: 'player-win',
    playerEffectMode: 'full',
    enemyIntentMode: 'cancel',
  },
  draw: {
    outcome: 'draw',
    playerEffectMode: 'half',
    enemyIntentMode: 'half',
  },
  'enemy-win': {
    outcome: 'enemy-win',
    playerEffectMode: 'none',
    enemyIntentMode: 'full',
  },
};

export function clashConsequenceFromResolution(
  resolution: ClashResolution,
): ClashConsequence | undefined {
  if (!resolution.eligible) return undefined;
  return { ...CONSEQUENCES[resolution.outcome] };
}
