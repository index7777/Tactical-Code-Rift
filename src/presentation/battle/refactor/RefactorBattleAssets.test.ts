import { describe, expect, it } from 'vitest';
import {
  REFACTOR_BATTLE_BACKGROUND_KEY,
  REFACTOR_BATTLE_MUSIC_KEY,
  REFACTOR_IMPACT_SFX_KEY,
  REFACTOR_QA_ENEMY_KEY,
  REFACTOR_SWISH_SFX_KEY,
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

  it('uses the committed hd2d rail-halt candidate and existing combat audio assets', () => {
    expect(REFACTOR_BATTLE_BACKGROUND_KEY).toBe('refactor-bg-area01-rail-halt-hd2d-v2');
    expect(REFACTOR_BATTLE_MUSIC_KEY).toBe('refactor-battle-music');
    expect(REFACTOR_SWISH_SFX_KEY).toBe('refactor-sfx-sword-swish');
    expect(REFACTOR_IMPACT_SFX_KEY).toBe('refactor-sfx-sword-impact');
  });
});
