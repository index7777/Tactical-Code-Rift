import Phaser from 'phaser';
import './styles.css';
import './input-lock.css';
import { refactorViewportScaleMode } from './presentation/battle/refactor/RefactorBattleViewportPolicy';
import { JourneyScene } from './presentation/scenes/JourneyScene';
import { RefactorBattleScene } from './presentation/scenes/RefactorBattleScene';

for (const eventName of ['contextmenu', 'dragstart', 'selectstart'] as const) {
  document.addEventListener(eventName, (event) => event.preventDefault(), { capture: true });
}

const viewportScaleMode = refactorViewportScaleMode(window.innerWidth, window.innerHeight);
const qaBattleNodeId = new URLSearchParams(window.location.search).get('qa-battle');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#090c18',
  render: { antialias: true, pixelArt: false, roundPixels: false },
  scale: {
    mode: viewportScaleMode === 'COVER' ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  input: { activePointers: 3 },
  scene: qaBattleNodeId
    ? [RefactorBattleScene, JourneyScene]
    : [JourneyScene, RefactorBattleScene],
};

const game = new Phaser.Game(config);

declare global {
  interface Window {
    __TACTICAL_RIFT_GAME__?: Phaser.Game;
  }
}

// Read-only browser QA uses this handle to verify every encounter scene.
window.__TACTICAL_RIFT_GAME__ = game;
