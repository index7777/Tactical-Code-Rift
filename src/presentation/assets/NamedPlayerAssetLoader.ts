import type Phaser from 'phaser';

const poses = ['idle-a', 'idle-b', 'ready', 'attack-a', 'attack-b', 'hit-a', 'hit-b', 'down'] as const;

export function queueNamedPlayerAssets(load: Phaser.Loader.LoaderPlugin): void {
  for (const id of ['rin', 'chikage', 'oboro', 'mo']) {
    for (const pose of poses) load.image(`${id}-${pose}`, `assets/battle/characters/${id}/runtime/${id}-${pose}.png`);
  }
  load.image('portrait-rin-current', 'assets/battle/characters/rin/portraits/amamiya-rin-portrait-current.png');
  load.image('portrait-rin-timeline', 'assets/battle/characters/rin/portraits/amamiya-rin-portrait-timeline.png');
  load.image('portrait-mo-current', 'assets/battle/characters/mo/portraits/momiji-portrait-current.png');
  load.image('portrait-mo-timeline', 'assets/battle/characters/mo/portraits/momiji-portrait-timeline.png');
  load.image('portrait-chikage-current', 'assets/battle/characters/chikage/portraits/chikage-portrait-current.png');
  load.image('portrait-chikage-timeline', 'assets/battle/characters/chikage/portraits/chikage-portrait-timeline.png');
  load.image('portrait-oboro-current', 'assets/battle/characters/oboro/portraits/oboro-portrait-current.png');
  load.image('portrait-oboro-timeline', 'assets/battle/characters/oboro/portraits/oboro-portrait-timeline.png');
  load.image('fx-mo-slash-arc', 'assets/battle/characters/mo/fx/momiji-slash-arc.png');
  load.image('fx-mo-slash-impact', 'assets/battle/characters/mo/fx/momiji-impact-final.png');
}
