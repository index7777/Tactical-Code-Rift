import { describe, expect, it } from 'vitest';
import {
  REFACTOR_BATTLE_BACKGROUND_KEYS,
  REFACTOR_BOSS_MUSIC_KEY,
  REFACTOR_BATTLE_MUSIC_KEY,
  REFACTOR_IMPACT_SFX_KEY,
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

  it('maps canonical encounter enemies to battle and timeline textures', () => {
    expect(actorBattleTextureKey('lantern-child')).toBe('refactor-enemy-lantern-child');
    expect(actorTimelineTextureKey('rain-boss')).toBe('refactor-enemy-rain-boss-timeline');
    expect(actorBattleTextureKey('unknown-enemy')).toBeUndefined();
  });

  it('keeps the approved Boss master reusable when no separate timeline portrait exists', () => {
    expect(actorTimelineTextureKey('rain-boss')).toBe('refactor-enemy-rain-boss-timeline');
  });

  it('uses encounter backgrounds and the live combat audio keys', () => {
    expect(REFACTOR_BATTLE_BACKGROUND_KEYS['rail-halt']).toBe('refactor-bg-area01-rail-halt-hd2d-v2');
    expect(REFACTOR_BATTLE_BACKGROUND_KEYS['terminal-platform']).toBe('refactor-bg-area01-terminal-platform-v1');
    expect(REFACTOR_BATTLE_MUSIC_KEY).toBe('battle-music');
    expect(REFACTOR_BOSS_MUSIC_KEY).toBe('boss-battle-music');
    expect(REFACTOR_SWISH_SFX_KEY).toBe('refactor-sfx-sword-swish');
    expect(REFACTOR_IMPACT_SFX_KEY).toBe('refactor-sfx-sword-impact');
  });
});
