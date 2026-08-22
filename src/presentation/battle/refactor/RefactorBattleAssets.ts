import type Phaser from 'phaser';
import {
  playerAssetManifest,
  queuePlayerAssets,
  type PlayerAssetEntry,
} from '../../assets/PlayerAssetManifest';

export const REFACTOR_BATTLE_BACKGROUND_KEYS = {
  'rail-halt': 'refactor-bg-area01-rail-halt-hd2d-v2',
  'mountain-cut': 'refactor-bg-area01-mountain-cut-v1',
  'forest-path': 'refactor-bg-area01-forest-path-v2',
  'terminal-platform': 'refactor-bg-area01-terminal-platform-v1',
} as const;
export const REFACTOR_BATTLE_MUSIC_KEY = 'battle-music';
export const REFACTOR_BOSS_MUSIC_KEY = 'boss-battle-music';
export const REFACTOR_SWISH_SFX_KEY = 'refactor-sfx-sword-swish';
export const REFACTOR_IMPACT_SFX_KEY = 'refactor-sfx-sword-impact';
export const REFACTOR_CARD_FRAME_KEY = 'refactor-card-frame-neutral-v1';
export function refactorCardFamilyTextureKey(category: string): string {
  return `refactor-card-family-${category}-v1`;
}

const ENEMY_IDS = [
  'wet-corpse',
  'lantern-child',
  'mountain-hound',
  'wayfarer-umbrella',
  'noose-ghost',
  'lost-monk',
  'rain-warrior',
  'rain-boss',
] as const;

const playerById = new Map(playerAssetManifest.map((entry) => [entry.id, entry]));

export function playerAssetEntry(actorId: string): PlayerAssetEntry | undefined {
  return playerById.get(actorId as PlayerAssetEntry['id']);
}

export function playerPoseTextureKey(
  actorId: string,
  pose: 'idle-a' | 'idle-b' | 'ready' | 'attack-a' | 'attack-b' | 'hit-a' | 'hit-b' | 'down' = 'idle-a',
): string | undefined {
  const entry = playerAssetEntry(actorId);
  return entry ? `${entry.assetPrefix}-${pose}` : undefined;
}

export function playerTimelinePortraitKey(actorId: string): string | undefined {
  const entry = playerAssetEntry(actorId);
  return entry ? `portrait-${entry.assetPrefix}-timeline` : undefined;
}

export function actorBattleTextureKey(actorId: string): string | undefined {
  return playerPoseTextureKey(actorId) ?? (ENEMY_IDS.includes(actorId as (typeof ENEMY_IDS)[number])
    ? `refactor-enemy-${actorId}`
    : undefined);
}

export function actorTimelineTextureKey(actorId: string): string | undefined {
  return playerTimelinePortraitKey(actorId) ?? (ENEMY_IDS.includes(actorId as (typeof ENEMY_IDS)[number])
    ? `refactor-enemy-${actorId}-timeline`
    : undefined);
}

export function queueRefactorBattleAssets(load: Phaser.Loader.LoaderPlugin): void {
  queuePlayerAssets(load);
  load.image(REFACTOR_BATTLE_BACKGROUND_KEYS['rail-halt'], 'assets/battle/area01-rail-halt-hd2d-candidate-v2.png');
  load.image(REFACTOR_BATTLE_BACKGROUND_KEYS['mountain-cut'], 'assets/battle/area01-mountain-cut-bg-runtime-trial-v1.png');
  load.image(REFACTOR_BATTLE_BACKGROUND_KEYS['forest-path'], 'assets/battle/area01-forest-path-bg-runtime-trial-v2.png');
  load.image(REFACTOR_BATTLE_BACKGROUND_KEYS['terminal-platform'], 'assets/battle/area01-terminal-platform-bg-runtime-trial-v1.png');
  for (const enemyId of ENEMY_IDS) {
    load.image(
      `refactor-enemy-${enemyId}`,
      `assets/battle/generated/monsters/rainfall-ridgeline/${enemyId}-master-runtime-v1.png`,
    );
    load.image(
      `refactor-enemy-${enemyId}-timeline`,
      enemyId === 'rain-boss'
        ? 'assets/battle/generated/monsters/rainfall-ridgeline/rain-boss-master-runtime-v1.png'
        : `assets/battle/portraits/${enemyId}-timeline.png`,
    );
  }
  load.image(REFACTOR_CARD_FRAME_KEY, 'assets/battle/cards/master-v1/card-frame-neutral.png');
  for (const family of ['quick', 'heavy', 'guard', 'disruption', 'break']) {
    load.image(refactorCardFamilyTextureKey(family), `assets/battle/cards/master-v1/card-family-${family}.png`);
  }
  load.audio(REFACTOR_BATTLE_MUSIC_KEY, 'assets/battle/demo_battle01.mp3');
  load.audio(REFACTOR_BOSS_MUSIC_KEY, 'assets/music/world-01/zone1-boss-bgm.mp3');
  load.audio(REFACTOR_SWISH_SFX_KEY, 'assets/battle/sword-swish.wav');
  load.audio(REFACTOR_IMPACT_SFX_KEY, 'assets/battle/sword-impact.wav');
}
