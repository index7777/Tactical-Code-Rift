import Phaser from 'phaser';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
} from '../battle/refactor/BattleActorPresenter';
import type { RefactorBattleRuntime, RefactorBattleView } from '../battle/refactor/RefactorBattleRuntime';

const RUNTIME_REGISTRY_KEY = 'refactor-battle-runtime';

export class RefactorBattleScene extends Phaser.Scene {
  private runtime?: RefactorBattleRuntime;
  private content?: Phaser.GameObjects.Container;

  constructor() {
    super('RefactorBattleScene');
  }

  create(): void {
    this.runtime = this.registry.get(RUNTIME_REGISTRY_KEY) as RefactorBattleRuntime | undefined;
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    const layout = REFACTOR_BATTLE_LAYOUT;

    this.addToContent(this.add.rectangle(640, 360, layout.width, layout.height, 0x07101a, 1));
    this.drawPanel(layout.timeline, 0x0d1823, 0x7896a3);
    this.drawPanel(layout.battlefield, 0x09141d, 0x6f8d96);
    this.drawPanel(layout.partyRail, 0x0c1a22, 0x739aa2);
    this.drawPanel(layout.intentPanel, 0x141b22, 0xb28f65);
    this.drawPanel(layout.hand, 0x081018, 0x708b94);

    if (!this.runtime) {
      this.addText(640, 336, 'REFACTOR BATTLE RUNTIME NOT ATTACHED', '18px', '#e5c98d', 0.5);
      this.addText(640, 370, '此 Scene 保持 dormant；不建立 mock combat state。', '14px', '#a9c2c7', 0.5);
      return;
    }

    this.renderView(this.runtime.view());
  }

  private renderView(view: RefactorBattleView): void {
    const layout = REFACTOR_BATTLE_LAYOUT;
    this.addText(32, 20, 'TIMELINE', '12px', '#9fc5cd');
    this.addText(32, 44, `${view.phase}${view.activeActorId ? ` · ${view.activeActorId}` : ''}`, '13px', '#d8e7e9');

    view.timeline.forEach((node, index) => {
      const x = 230 + index * 118;
      const y = 48;
      const fill = node.team === 'player' ? 0x17303d : 0x3a2325;
      const stroke = node.team === 'player' ? 0x8fb9c3 : 0xc48c83;
      const circle = this.add.circle(x, y, 24, fill, 0.98).setStrokeStyle(2, stroke, 0.75);
      this.addToContent(circle);
      this.addText(x, y - 5, node.actorId, '10px', '#eef5f3', 0.5);
      this.addText(x, y + 12, `@${node.nextActionAt}`, '10px', '#d8c98f', 0.5);
    });

    this.addText(layout.partyRail.x + 14, layout.partyRail.y + 12, 'PARTY', '11px', '#9fc5cd');
    for (const position of PLAYER_HOME_POSITIONS) {
      const vitals = view.vitalsByActorId[position.actorId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const circle = this.add.circle(position.x, position.y, 29, alive ? 0x17303d : 0x1c2024, 0.96)
        .setStrokeStyle(2, alive ? 0x9ebbc1 : 0x555d61, 0.7);
      this.addToContent(circle);
      this.addText(position.x, position.y - 7, position.actorId, '11px', '#eef5f3', 0.5);
      this.addText(
        position.x,
        position.y + 12,
        vitals ? `${vitals.hp}/${vitals.maxHp}` : '--',
        '10px',
        alive ? '#bcd9d7' : '#727c80',
        0.5,
      );
    }

    const enemyIds = view.timeline
      .filter((node) => node.team === 'enemy')
      .map((node) => node.actorId)
      .filter((actorId, index, all) => all.indexOf(actorId) === index);
    enemyIds.forEach((enemyId, index) => {
      const x = 870 + index * 135;
      const y = 300 + (index % 2) * 90;
      const vitals = view.vitalsByActorId[enemyId];
      const target = this.add.circle(x, y, 40, 0x402629, 0.96)
        .setStrokeStyle(2, 0xc18f86, 0.75);
      this.addToContent(target);
      this.addText(x, y - 8, enemyId, '12px', '#f0dddd', 0.5);
      this.addText(x, y + 13, vitals ? `${vitals.hp}/${vitals.maxHp}` : '--', '11px', '#dcb7af', 0.5);
      if (view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
        target.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.previewTarget(enemyId);
          this.render();
        });
      }
    });

    this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 12, 'ENEMY INTENT', '11px', '#d8b98d');
    const intent = view.enemyIntents[0];
    if (intent) {
      this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 38, intent.name, '15px', '#f0ded0');
      this.addText(
        layout.intentPanel.x + 14,
        layout.intentPanel.y + 66,
        `Target ${intent.targetIds.join(', ') || '—'}\nDamage ${intent.damage ?? 0} · Delay ${intent.delay}`,
        '12px',
        '#c7d8d9',
      );
    } else {
      this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 42, '—', '14px', '#899da2');
    }

    if (view.preview) {
      this.addText(640, 188, `PREVIEW · ${view.preview.targetId ?? '—'}`, '12px', '#e8ca7d', 0.5);
      this.addText(
        640,
        214,
        `DMG ${view.preview.finalDamage} · HP ${view.preview.hpBefore ?? '—'}→${view.preview.hpAfter ?? '—'} · Delay +${view.preview.actualDelay} · 窗口 +${view.preview.crossedPlayerWindows}`,
        '13px',
        view.preview.lethal ? '#f29a8f' : '#dce9e7',
        0.5,
      );
    }

    this.addText(32, layout.hand.y + 14, 'SHARED HAND', '11px', '#9fc5cd');
    view.hand.forEach((card, index) => {
      const x = 245 + index * 160;
      const y = layout.hand.y + 112;
      const rectangle = this.add.rectangle(x, y, 136, 138, card.selected ? 0x243b43 : 0x12222c, 1)
        .setStrokeStyle(card.selected ? 2 : 1, card.selected ? 0xd7bd78 : 0x8aa4ad, card.selected ? 0.95 : 0.5);
      this.addToContent(rectangle);
      this.addText(x, y - 34, card.name, '12px', '#edf3f2', 0.5);
      this.addText(x, y - 8, card.category, '10px', '#9fc5cd', 0.5);
      this.addText(x, y + 20, `Delay ${card.delay}`, '12px', '#e4c579', 0.5);
      this.addText(x, y + 43, card.targetRule, '10px', '#aebfc2', 0.5);
      if (view.phase === 'PLAYER_IDLE' || view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
        rectangle.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.selectCard(card.instanceId);
          this.render();
        });
      }
    });

    if (view.phase === 'WAITING_FOR_NEXT_ACTOR') {
      this.drawButton(1110, layout.hand.y + 70, 150, 46, '開始下一角色', () => {
        this.runtime?.startNextActor();
        this.render();
      });
    } else if (view.canDispatch) {
      this.drawButton(1110, layout.hand.y + 62, 144, 44, '調度 0 張', () => {
        this.runtime?.dispatch([]);
        this.render();
      });
    }

    if (view.canConfirm) {
      this.drawButton(1110, layout.hand.y + 118, 144, 44, '確認執行', () => {
        this.runtime?.confirmCard();
        this.runtime?.resolveConfirmedPlayerAction();
        this.render();
      });
    }

    if (view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
      this.drawButton(1110, layout.hand.y + 168, 144, 36, '取消', () => {
        this.runtime?.cancel();
        this.render();
      });
    }
  }

  private drawPanel(
    rect: { x: number; y: number; width: number; height: number },
    fill: number,
    stroke: number,
  ): void {
    this.addToContent(
      this.add.rectangle(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
        fill,
        0.96,
      ).setStrokeStyle(1, stroke, 0.35),
    );
  }

  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    action: () => void,
  ): void {
    const button = this.add.rectangle(x, y, width, height, 0x2b251b, 1)
      .setStrokeStyle(1, 0xc4a361, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action);
    this.addToContent(button);
    this.addText(x, y, label, '12px', '#f0d69d', 0.5);
  }

  private addText(
    x: number,
    y: number,
    text: string,
    fontSize: string,
    color: string,
    origin = 0,
  ): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize,
      color,
      lineSpacing: 4,
      align: origin === 0.5 ? 'center' : 'left',
    }).setOrigin(origin);
    this.addToContent(label);
    return label;
  }

  private addToContent<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.content?.add(object);
    return object;
  }
}
