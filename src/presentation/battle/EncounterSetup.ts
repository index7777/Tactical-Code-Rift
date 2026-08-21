import { battleMusicKey, battleMusicKind } from '../../core/audio/BattleMusicPolicy';
import { storyEncounter } from '../../core/route/EncounterCatalog';
import type { BattlefieldMode } from './BattlefieldMode';

export interface EncounterSetup {
  enemyCount: number;
  battlefield?: BattlefieldMode;
  musicKey: string;
}

export function encounterSetup(journeyNodeId?: string, requestedBattlefield?: BattlefieldMode): EncounterSetup {
  const encounter = storyEncounter(journeyNodeId);
  return {
    enemyCount: encounter?.enemies.length ?? 4,
    battlefield: requestedBattlefield ?? encounter?.battlefield,
    musicKey: battleMusicKey(battleMusicKind(journeyNodeId)),
  };
}
