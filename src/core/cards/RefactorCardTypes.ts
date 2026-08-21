export type RefactorCardCategory = 'quick' | 'heavy' | 'guard' | 'disruption' | 'break';

export type RefactorTargetRule = 'enemy' | 'self' | 'ally' | 'any-ally' | 'none';

export interface RefactorCardEffect {
  damage?: number;
  delayTarget?: number;
  guardRatio?: number;
  guardCap?: number;
  createBreakWindow?: 'armor-break' | 'imbalance';
  interrupt?: boolean;
}

export interface RefactorCardDefinition {
  id: string;
  name: string;
  category: RefactorCardCategory;
  delay: number;
  targetRule: RefactorTargetRule;
  effect: RefactorCardEffect;
}

export interface RefactorCardInstance {
  instanceId: string;
  definition: RefactorCardDefinition;
}

export interface RefactorDeckState {
  hand: RefactorCardInstance[];
  drawPile: RefactorCardInstance[];
  discardPile: RefactorCardInstance[];
  rngState: number;
}

export interface RefactorPlayResult {
  state: RefactorDeckState;
  played: RefactorCardInstance;
}

export interface RefactorDispatchResult {
  state: RefactorDeckState;
  discarded: RefactorCardInstance[];
}
