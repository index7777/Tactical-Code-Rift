import type Phaser from 'phaser';
import {
  playerAssetManifest,
  queuePlayerAssets,
  type PlayerAssetEntry,
} from '../../assets/PlayerAssetManifest';
import { cardFamilyAssetSlots } from './CardFamilyAssetPolicy';

export const REFACTOR_BATTLE_BACKGROUND_KEY = 'refactor-bg-area01-rail-halt-hd2d-v2';
export const REFACTOR_QA_ENEMY_KEY = 'refactor-enemy-lantern-child';
export const REFACTOR_SLASH_FX_KEY = 'refactor-fx-slash';
export const REFACTOR_BATTLE_MUSIC_KEY = 'refactor-battle-music';
export const REFACTOR_SWISH_SFX_KEY = 'refactor-sfx-sword-swish';
export const REFACTOR_IMPACT_SFX_KEY = 'refactor-sfx-sword-impact';

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
  return playerPoseTextureKey(actorId) ?? (actorId === 'ghost-fire' ? REFACTOR_QA_ENEMY_KEY : undefined);
}

export function actorTimelineTextureKey(actorId: string): string | undefined {
  return playerTimelinePortraitKey(actorId) ?? (actorId === 'ghost-fire' ? REFACTOR_QA_ENEMY_KEY : undefined);
}

export function queueRefactorBattleAssets(load: Phaser.Loader.LoaderPlugin): void {
  queuePlayerAssets(load);
  load.image(REFACTOR_BATTLE_BACKGROUND_KEY, 'assets/battle/area01-rail-halt-hd2d-candidate-v2.png');
  load.image(
    REFACTOR_QA_ENEMY_KEY,
    'assets/battle/generated/monsters/rainfall-ridgeline/lantern-child-master-runtime-v1.png',
  );
  load.image(REFACTOR_SLASH_FX_KEY, 'assets/battle/fx/p9a-arc-slash-1.png');
  for (const slot of cardFamilyAssetSlots()) {
    load.image(slot.textureKey, slot.path);
  }
  load.audio(REFACTOR_BATTLE_MUSIC_KEY, 'assets/battle/battle-music.ogg');
  load.audio(REFACTOR_SWISH_SFX_KEY, 'assets/battle/sword-swish.wav');
  load.audio(REFACTOR_IMPACT_SFX_KEY, 'assets/battle/sword-impact.wav');
}
