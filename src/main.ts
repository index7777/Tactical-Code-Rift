import Phaser from 'phaser';
import './styles.css';
import './input-lock.css';
import { createRefactorBattleBootstrap } from './application/battle/createRefactorBattleBootstrap';
import { RefactorBattleRuntime } from './presentation/battle/refactor/RefactorBattleRuntime';
import { BootScene } from './presentation/scenes/BootScene';
import { JourneyScene } from './presentation/scenes/JourneyScene';
import { RefactorBattleScene } from './presentation/scenes/RefactorBattleScene';

for (const eventName of ['contextmenu', 'dragstart', 'selectstart'] as const) {
  document.addEventListener(eventName, (event) => event.preventDefault(), { capture: true });
}

const refactorBattleEnabled = new URLSearchParams(window.location.search).get('combat-refactor') === '1';
const refactorBattleRuntime = refactorBattleEnabled
  ? new RefactorBattleRuntime(createRefactorBattleBootstrap())
  : undefined;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#090c18',
  render: { antialias: true, pixelArt: false, roundPixels: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  input: { activePointers: 3 },
  callbacks: {
    preBoot: (game) => {
      if (refactorBattleRuntime) {
        game.registry.set('refactor-battle-runtime', refactorBattleRuntime);
      }
    },
  },
  scene: refactorBattleEnabled
    ? [RefactorBattleScene, BootScene, JourneyScene]
    : [BootScene, JourneyScene, RefactorBattleScene],
};

const game = new Phaser.Game(config);

declare global {
  interface Window {
    __TACTICAL_RIFT_GAME__?: Phaser.Game;
  }
}

// Read-only browser QA uses this handle to verify every encounter scene.
window.__TACTICAL_RIFT_GAME__ = game;
