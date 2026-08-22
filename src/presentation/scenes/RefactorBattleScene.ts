import Phaser from 'phaser';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
} from '../battle/refactor/BattleActorPresenter';

export class RefactorBattleScene extends Phaser.Scene {
  constructor() {
    super('RefactorBattleScene');
  }

  create(): void {
    const layout = REFACTOR_BATTLE_LAYOUT;
    this.add.rectangle(640, 360, layout.width, layout.height, 0x07101a, 1);

    this.add.rectangle(
      layout.timeline.x + layout.timeline.width / 2,
      layout.timeline.y + layout.timeline.height / 2,
      layout.timeline.width,
      layout.timeline.height,
      0x0d1823,
      0.96,
    ).setStrokeStyle(1, 0x7896a3, 0.35);
    this.add.text(32, 24, 'TIMELINE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9fc5cd',
    });
    this.add.text(160, 24, '單一敵我時序｜未來 6–8 節點', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#d8e7e9',
    });

    this.add.rectangle(
      layout.battlefield.x + layout.battlefield.width / 2,
      layout.battlefield.y + layout.battlefield.height / 2,
      layout.battlefield.width,
      layout.battlefield.height,
      0x09141d,
      0.92,
    ).setStrokeStyle(1, 0x6f8d96, 0.28);

    this.add.rectangle(
      layout.partyRail.x + layout.partyRail.width / 2,
      layout.partyRail.y + layout.partyRail.height / 2,
      layout.partyRail.width,
      layout.partyRail.height,
      0x0c1a22,
      0.9,
    ).setStrokeStyle(1, 0x739aa2, 0.35);
    this.add.text(layout.partyRail.x + 16, layout.partyRail.y + 14, 'PARTY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9fc5cd',
    });

    for (const position of PLAYER_HOME_POSITIONS) {
      this.add.circle(position.x, position.y, 28, 0x17303d, 0.95)
        .setStrokeStyle(2, 0x9ebbc1, 0.7);
      this.add.text(position.x, position.y, position.actorId, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#eef5f3',
      }).setOrigin(0.5);
    }

    this.add.circle(
      layout.actionPosition.x,
      layout.actionPosition.y,
      52,
      0x25363c,
      0.35,
    ).setStrokeStyle(2, 0xc7a665, 0.65);
    this.add.text(layout.actionPosition.x, layout.actionPosition.y, 'ACTION\nZONE', {
      align: 'center',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e7cf95',
    }).setOrigin(0.5);

    this.add.rectangle(
      layout.intentPanel.x + layout.intentPanel.width / 2,
      layout.intentPanel.y + layout.intentPanel.height / 2,
      layout.intentPanel.width,
      layout.intentPanel.height,
      0x141b22,
      0.94,
    ).setStrokeStyle(1, 0xb28f65, 0.5);
    this.add.text(layout.intentPanel.x + 14, layout.intentPanel.y + 14, 'ENEMY INTENT', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d8b98d',
    });
    this.add.text(layout.intentPanel.x + 14, layout.intentPanel.y + 48, '公開 Intent\n與持續狀態分離', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#dce6e5',
      lineSpacing: 8,
    });

    this.add.rectangle(
      layout.hand.x + layout.hand.width / 2,
      layout.hand.y + layout.hand.height / 2,
      layout.hand.width,
      layout.hand.height,
      0x081018,
      0.98,
    ).setStrokeStyle(1, 0x708b94, 0.35);
    this.add.text(32, layout.hand.y + 18, 'SHARED HAND', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9fc5cd',
    });

    const cardY = layout.hand.y + 112;
    for (let index = 0; index < 5; index += 1) {
      const x = 250 + index * 160;
      this.add.rectangle(x, cardY, 132, 136, 0x12222c, 1)
        .setStrokeStyle(1, 0x8aa4ad, 0.5);
      this.add.text(x, cardY, `CARD ${index + 1}\nDelay`, {
        align: 'center',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e5eeee',
      }).setOrigin(0.5);
    }

    this.add.rectangle(1085, cardY, 128, 92, 0x2b251b, 1)
      .setStrokeStyle(1, 0xc4a361, 0.75);
    this.add.text(1085, cardY, '調度\n0–2 張\nDelay 3', {
      align: 'center',
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#f0d69d',
      lineSpacing: 4,
    }).setOrigin(0.5);
  }
}
