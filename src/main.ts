import Phaser from 'phaser';
import './styles.css';
import './input-lock.css';
import {
  createRefactorBattleBootstrap,
  createRefactorQaEnemyIntent,
} from './application/battle/createRefactorBattleBootstrap';
import { resolveCombatEntry } from './application/battle/CombatEntryPolicy';
import { RefactorBattleRuntime } from './presentation/battle/refactor/RefactorBattleRuntime';
import { refactorViewportScaleMode } from './presentation/battle/refactor/RefactorBattleViewportPolicy';
import { BootScene } from './presentation/scenes/BootScene';
import { JourneyScene } from './presentation/scenes/JourneyScene';
import { RefactorBattleScene } from './presentation/scenes/RefactorBattleScene';

for (const eventName of ['contextmenu', 'dragstart', 'selectstart'] as const) {
  document.addEventListener(eventName, (event) => event.preventDefault(), { capture: true });
}

const combatEntry = resolveCombatEntry(window.location.search);
const refactorBattleRuntime = combatEntry.attachRefactorRuntime
  ? new RefactorBattleRuntime(createRefactorBattleBootstrap(), createRefactorQaEnemyIntent)
  : undefined;
const viewportScaleMode = combatEntry.mode === 'refactor'
  ? refactorViewportScaleMode(window.innerWidth, window.innerHeight)
  : 'FIT';

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
  callbacks: {
    preBoot: (game) => {
      if (refactorBattleRuntime) {
        game.registry.set('refactor-battle-runtime', refactorBattleRuntime);
      }
    },
  },
  scene: combatEntry.mode === 'legacy'
    ? [BootScene, JourneyScene, RefactorBattleScene]
    : [RefactorBattleScene, BootScene, JourneyScene],
};

const game = new Phaser.Game(config);

declare global {
  interface Window {
    __TACTICAL_RIFT_GAME__?: Phaser.Game;
  }
}

// Read-only browser QA uses this handle to verify every encounter scene.
window.__TACTICAL_RIFT_GAME__ = game;
