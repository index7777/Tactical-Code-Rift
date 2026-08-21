import type Phaser from 'phaser';
import manifestJson from './player-assets.json';

export const playerPoseNames = [
  'idle-a',
  'idle-b',
  'ready',
  'attack-a',
  'attack-b',
  'hit-a',
  'hit-b',
  'down',
] as const;

export type PlayerPoseName = (typeof playerPoseNames)[number];

export interface PlayerAssetEntry {
  id: 'rin' | 'chikage' | 'oboro' | 'mo';
  assetPrefix: string;
  poseRoot: string;
  poseFilePrefix: string;
  currentPortrait: string;
  timelinePortrait: string;
}

export const playerAssetManifest = manifestJson.characters as readonly PlayerAssetEntry[];

export function queuePlayerAssets(load: Phaser.Loader.LoaderPlugin): void {
  for (const character of playerAssetManifest) {
    for (const pose of playerPoseNames) {
      load.image(
        `${character.assetPrefix}-${pose}`,
        `${character.poseRoot}/${character.poseFilePrefix}-${pose}.png`,
      );
    }
    load.image(`portrait-${character.assetPrefix}-current`, character.currentPortrait);
    load.image(`portrait-${character.assetPrefix}-timeline`, character.timelinePortrait);
  }

  load.image('fx-mo-slash-arc', 'assets/battle/generated/characters/redleaf/production/redleaf-slash-arc.png');
  load.image('fx-mo-slash-impact', 'assets/battle/generated/characters/redleaf/production/redleaf-slash-impact.png');
}
