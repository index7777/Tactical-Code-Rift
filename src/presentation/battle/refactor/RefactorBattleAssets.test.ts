import { describe, expect, it } from 'vitest';
import { AREA01_RAIL_HALT_HD2D_Q60_DATA_URI } from '../../assets/generated/area01RailHaltHd2dQ60';
import {
  REFACTOR_BATTLE_BACKGROUND_KEY,
  REFACTOR_BATTLE_MUSIC_KEY,
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

  it('maps the QA enemy id to the current rainfall-ridgeline runtime texture key', () => {
    expect(actorBattleTextureKey('ghost-fire')).toBe(REFACTOR_QA_ENEMY_KEY);
    expect(actorTimelineTextureKey('ghost-fire')).toBe(REFACTOR_QA_ENEMY_KEY);
    expect(REFACTOR_QA_ENEMY_KEY).toBe('refactor-enemy-lantern-child');
    expect(actorBattleTextureKey('unknown-enemy')).toBeUndefined();
  });

  it('uses the provided hd2d rail-halt candidate and battle music in refactor runtime', () => {
    expect(REFACTOR_BATTLE_BACKGROUND_KEY).toBe('refactor-bg-area01-rail-halt-hd2d-v2');
    expect(AREA01_RAIL_HALT_HD2D_Q60_DATA_URI.startsWith('data:image/jpeg;base64,/9j/')).toBe(true);
    expect(AREA01_RAIL_HALT_HD2D_Q60_DATA_URI).not.toContain('area01-rail-halt-bg-runtime-trial-v1.png');
    expect(REFACTOR_BATTLE_MUSIC_KEY).toBe('refactor-battle-music');
  });
});
