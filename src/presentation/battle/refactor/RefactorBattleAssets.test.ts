import { describe, expect, it } from 'vitest';
import {
  REFACTOR_QA_ENEMY_KEY,
  actorBattleTextureKey,
  actorTimelineTextureKey,
  playerAssetEntry,
  playerPoseTextureKey,
  playerTimelinePortraitKey,
} from './RefactorBattleAssets';

describe('RefactorBattleAssets', () => {
  it('maps all four player ids through the authoritative manifest', () => {
    expect(playerAssetEntry('rin')?.assetPrefix).toBe('player-rin');
    expect(playerAssetEntry('chikage')?.assetPrefix).toBe('player-chikage');
    expect(playerAssetEntry('oboro')?.assetPrefix).toBe('player-oboro');
    expect(playerAssetEntry('mo')?.assetPrefix).toBe('player-mo');
  });

  it('builds pose and timeline portrait keys from manifest prefixes', () => {
    expect(playerPoseTextureKey('rin')).toBe('player-rin-idle-a');
    expect(playerPoseTextureKey('mo', 'down')).toBe('player-mo-down');
    expect(playerTimelinePortraitKey('chikage')).toBe('portrait-player-chikage-timeline');
  });

  it('uses the QA yokai visual only for ghost-fire', () => {
    expect(actorBattleTextureKey('ghost-fire')).toBe(REFACTOR_QA_ENEMY_KEY);
    expect(actorTimelineTextureKey('ghost-fire')).toBe(REFACTOR_QA_ENEMY_KEY);
    expect(actorBattleTextureKey('unknown-enemy')).toBeUndefined();
  });
});
