export type BattleOutcome = 'victory' | 'defeat';

export interface BattleExitDecision {
  label: '返回路線' | '重新挑戰';
  destination: 'journey' | 'retry';
  markArea01Cleared: boolean;
}

export function battleExitDecision(
  outcome: BattleOutcome,
  journeyNodeId: string,
): BattleExitDecision {
  if (outcome === 'defeat') {
    return { label: '重新挑戰', destination: 'retry', markArea01Cleared: false };
  }
  return {
    label: '返回路線',
    destination: 'journey',
    markArea01Cleared: journeyNodeId === 'boss-1',
  };
}
