import Phaser from 'phaser';

export interface FighterHudState {
  hp: number;
  shield: number;
  balance: number;
  exposed: boolean;
  broken: boolean;
}

export interface FighterHudView {
  root: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
  hpEcho: Phaser.GameObjects.Rectangle;
  shieldMarks: Phaser.GameObjects.Rectangle[];
  balanceMarks: Phaser.GameObjects.Arc[];
  state: Phaser.GameObjects.Text;
}

export class FighterHudPresenter {
  constructor(private scene: Phaser.Scene) {}

  create(id: string, team: 'player' | 'enemy'): FighterHudView {
    const accent = team === 'player' ? 0x61dff2 : 0xef526d;
    const root = this.scene.add.container(0, 53);
    const crest = this.scene.add.circle(-35, -5, 10, 0x07101b, .95).setStrokeStyle(2, accent, .95);
    const label = this.scene.add.text(-35, -5, id.slice(1), {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(.5);
    const hpBack = this.scene.add.rectangle(-21, -7, 58, 5, 0x24141a, .96).setOrigin(0, .5);
    const hpEcho = this.scene.add.rectangle(-21, -7, 58, 5, 0xf2d9d9, .8).setOrigin(0, .5);
    const hpFill = this.scene.add.rectangle(-21, -7, 58, 5, 0xd8465f).setOrigin(0, .5);
    const shieldMarks = Array.from({ length: 4 }, (_, index) =>
      this.scene.add.rectangle(-18 + index * 11, 3, 7, 9, 0x8de8ee, .95)
        .setStrokeStyle(1, 0xd9ffff, .8)
        .setRotation(index % 2 ? .08 : -.08),
    );
    const balanceMarks = Array.from({ length: 5 }, (_, index) =>
      this.scene.add.circle(-17 + index * 11, 13, 3.5, 0xd8ae4b, 1).setStrokeStyle(1, 0x5d451b, .9),
    );
    const state = this.scene.add.text(0, -112, '', {
      fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#fff',
      backgroundColor: '#8b2034', padding: { x: 7, y: 2 },
    }).setOrigin(.5).setVisible(false);
    root.add([crest, label, hpBack, hpEcho, hpFill, ...shieldMarks, ...balanceMarks, state]);
    return { root, hpFill, hpEcho, shieldMarks, balanceMarks, state };
  }

  refresh(view: FighterHudView, state: FighterHudState, animate = true) {
    const targetWidth = 58 * Phaser.Math.Clamp(state.hp, 0, 100) / 100;
    this.scene.tweens.killTweensOf(view.hpEcho);
    view.hpFill.width = targetWidth;
    if (animate && view.hpEcho.width > targetWidth) {
      this.scene.tweens.add({ targets: view.hpEcho, width: targetWidth, delay: 110, duration: 280, ease: 'Quad.easeIn' });
    } else {
      view.hpEcho.width = targetWidth;
    }
    const shieldCount = Math.min(4, Math.ceil(state.shield / 5));
    view.shieldMarks.forEach((mark, index) => mark.setVisible(index < shieldCount));
    const stanceCount = Math.min(5, Math.ceil(state.balance / 2));
    view.balanceMarks.forEach((mark, index) => {
      const active = index < stanceCount;
      mark.setFillStyle(active ? (state.balance <= 3 ? 0xff526b : 0xd8ae4b) : 0x2d281d, active ? 1 : .28);
      mark.setScale(state.balance <= 3 && active ? 1.18 : 1);
    });
    const status = state.broken ? '崩勢' : state.exposed ? '破綻' : '';
    view.state.setText(status).setBackgroundColor(state.broken ? '#a11e36' : '#6b2e55').setVisible(Boolean(status));
  }
}

