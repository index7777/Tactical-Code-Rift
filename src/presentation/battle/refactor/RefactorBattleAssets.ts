import type Phaser from 'phaser';
import {
  playerAssetManifest,
  queuePlayerAssets,
  type PlayerAssetEntry,
} from '../../assets/PlayerAssetManifest';

export const REFACTOR_BATTLE_BACKGROUND_KEY = 'refactor-bg-world01-rooftop';
export const REFACTOR_QA_ENEMY_KEY = 'refactor-enemy-ghost-fire';
export const REFACTOR_SLASH_FX_KEY = 'refactor-fx-slash';

const playerById = new Map(playerAssetManifest.map((entry) => [entry.id, entry]));

export function playerAssetEntry(actorId: string): PlayerAssetEntry | undefined {
  return playerById.get(actorId as PlayerAssetEntry['id']);
}

export function playerPoseTextureKey(actorId: string, pose: 'idle-a' | 'idle-b' | 'ready' | 'attack-a' | 'attack-b' | 'hit-a' | 'hit-b' | 'down' = 'idle-a'): string | undefined {
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
  load.image(REFACTOR_BATTLE_BACKGROUND_KEY, 'assets/battle/world01-rooftop-composite-candidate-v3.png');
  load.image(REFACTOR_QA_ENEMY_KEY, 'assets/battle/kamaitachi.png');
  load.image(REFACTOR_SLASH_FX_KEY, 'assets/battle/fx/p9a-arc-slash-1.png');
}
