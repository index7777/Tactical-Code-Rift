import Phaser from 'phaser';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
} from '../battle/refactor/BattleActorPresenter';
import {
  REFACTOR_BATTLE_BACKGROUND_KEY,
  actorBattleTextureKey,
  actorTimelineTextureKey,
  queueRefactorBattleAssets,
} from '../battle/refactor/RefactorBattleAssets';
import {
  actorDisplayName,
  autoAdvanceAction,
  categoryDisplayName,
  phaseDisplayName,
  targetRuleDisplayName,
} from '../battle/refactor/RefactorBattlePresentationPolicy';
import type { RefactorBattleRuntime, RefactorBattleView } from '../battle/refactor/RefactorBattleRuntime';

const RUNTIME_REGISTRY_KEY = 'refactor-battle-runtime';
const NEXT_ACTOR_DELAY_MS = 420;
const ENEMY_ACTION_DELAY_MS = 720;

export class RefactorBattleScene extends Phaser.Scene {
  private runtime?: RefactorBattleRuntime;
  private content?: Phaser.GameObjects.Container;
  private dispatchMode = false;
  private readonly dispatchSelection = new Set<string>();
  private autoAdvanceTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('RefactorBattleScene');
  }

  preload(): void {
    queueRefactorBattleAssets(this.load);
  }

  create(): void {
    this.runtime = this.registry.get(RUNTIME_REGISTRY_KEY) as RefactorBattleRuntime | undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearAutoAdvance());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.clearAutoAdvance());
    this.render();
  }

  private render(): void {
    this.clearAutoAdvance();
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    const layout = REFACTOR_BATTLE_LAYOUT;

    this.addToContent(this.add.rectangle(640, 360, layout.width, layout.height, 0x07101a, 1));
    this.drawPanel(layout.timeline, 0x0d1823, 0x7896a3);
    this.drawPanel(layout.battlefield, 0x09141d, 0x6f8d96);
    this.drawBattlefieldBackground();
    this.drawPanel(layout.partyRail, 0x0c1a22, 0x739aa2);
    this.drawPanel(layout.intentPanel, 0x141b22, 0xb28f65);
    this.drawPanel(layout.hand, 0x081018, 0x708b94);

    if (!this.runtime) {
      this.addText(640, 336, '新版戰鬥執行環境未連接', '18px', '#e5c98d', 0.5);
      this.addText(640, 370, '此場景保持停用，不建立模擬戰鬥狀態。', '14px', '#a9c2c7', 0.5);
      return;
    }

    this.renderView(this.runtime.view());
  }

  private renderView(view: RefactorBattleView): void {
    const layout = REFACTOR_BATTLE_LAYOUT;
    if (!view.canDispatch) {
      this.dispatchMode = false;
      this.dispatchSelection.clear();
    }

    this.addText(32, 20, '行動序列', '12px', '#9fc5cd');
    const actorLabel = view.activeActorId ? ` · ${actorDisplayName(view.activeActorId)}` : '';
    this.addText(32, 44, `${phaseDisplayName(view.phase)}${actorLabel}`, '13px', '#d8e7e9');

    view.timeline.forEach((node, index) => {
      const x = 230 + index * 118;
      const y = 46;
      const fill = node.team === 'player' ? 0x17303d : 0x3a2325;
      const stroke = node.team === 'player' ? 0x8fb9c3 : 0xc48c83;
      const circle = this.add.circle(x, y, 25, fill, 0.98).setStrokeStyle(2, stroke, 0.75);
      this.addToContent(circle);
      const portraitKey = actorTimelineTextureKey(node.actorId);
      if (portraitKey && this.textures.exists(portraitKey)) {
        this.addFittedImage(x, y - 3, portraitKey, 42, 42, 0.96);
      } else {
        this.addText(x, y - 6, actorDisplayName(node.actorId), '10px', '#eef5f3', 0.5);
      }
      this.addText(x, y + 35, `${actorDisplayName(node.actorId)} · ${node.nextActionAt}`, '9px', '#d8c98f', 0.5);
    });

    this.addText(layout.partyRail.x + 14, layout.partyRail.y + 12, '隊伍', '11px', '#9fc5cd');
    const targetable = new Set(view.targetableActorIds);
    for (const position of PLAYER_HOME_POSITIONS) {
      const vitals = view.vitalsByActorId[position.actorId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const isTargetable = targetable.has(position.actorId);
      const ring = this.add.circle(position.x, position.y, 42, 0x0b1720, 0.18)
        .setStrokeStyle(isTargetable ? 3 : 1, isTargetable ? 0xe1c371 : alive ? 0x9ebbc1 : 0x555d61, isTargetable ? 0.95 : 0.45);
      this.addToContent(ring);

      const textureKey = actorBattleTextureKey(position.actorId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actor = this.addFittedImage(position.x, position.y, textureKey, 96, 76, alive ? 1 : 0.42);
        if (isTargetable) {
          actor.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.runtime?.previewTarget(position.actorId);
            this.render();
          });
        }
      } else if (isTargetable) {
        ring.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.previewTarget(position.actorId);
          this.render();
        });
      }

      this.addText(position.x + 54, position.y - 16, actorDisplayName(position.actorId), '11px', '#eef5f3');
      this.addText(position.x + 54, position.y + 4, vitals ? `生命 ${vitals.hp}/${vitals.maxHp}` : '--', '10px', alive ? '#bcd9d7' : '#727c80');
    }

    const enemyIds = view.timeline
      .filter((node) => node.team === 'enemy')
      .map((node) => node.actorId)
      .filter((actorId, index, all) => all.indexOf(actorId) === index);
    enemyIds.forEach((enemyId, index) => {
      const x = 850 + index * 150;
      const y = 340 + (index % 2) * 90;
      const vitals = view.vitalsByActorId[enemyId];
      const isTargetable = targetable.has(enemyId);
      const ring = this.add.circle(x, y, 58, 0x301a1d, 0.22)
        .setStrokeStyle(isTargetable ? 3 : 2, isTargetable ? 0xe1c371 : 0xc18f86, isTargetable ? 0.95 : 0.65);
      this.addToContent(ring);

      const textureKey = actorBattleTextureKey(enemyId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actor = this.addFittedImage(x, y, textureKey, 118, 108, 1);
        if (isTargetable) {
          actor.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.runtime?.previewTarget(enemyId);
            this.render();
          });
        }
      } else if (isTargetable) {
        ring.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.previewTarget(enemyId);
          this.render();
        });
      }

      this.addText(x, y + 67, actorDisplayName(enemyId), '12px', '#f0dddd', 0.5);
      this.addText(x, y + 85, vitals ? `生命 ${vitals.hp}/${vitals.maxHp}` : '--', '11px', '#dcb7af', 0.5);
    });

    this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 12, '敵方意圖', '11px', '#d8b98d');
    const intent = view.enemyIntents[0];
    if (intent) {
      this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 38, intent.name, '15px', '#f0ded0');
      const targets = intent.targetIds.map(actorDisplayName).join('、') || '—';
      this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 66, `目標 ${targets}\n傷害 ${intent.damage ?? 0} · 延遲 ${intent.delay}`, '12px', '#c7d8d9');
    } else {
      this.addText(layout.intentPanel.x + 14, layout.intentPanel.y + 42, '—', '14px', '#899da2');
    }

    if (view.preview) {
      this.addText(640, 188, `預覽 · ${view.preview.targetId ? actorDisplayName(view.preview.targetId) : '—'}`, '12px', '#e8ca7d', 0.5);
      this.addText(640, 214, `傷害 ${view.preview.finalDamage} · 生命 ${view.preview.hpBefore ?? '—'}→${view.preview.hpAfter ?? '—'} · 延遲 +${view.preview.actualDelay} · 行動窗口 +${view.preview.crossedPlayerWindows}`, '13px', view.preview.lethal ? '#f29a8f' : '#dce9e7', 0.5);
    }

    this.addText(32, layout.hand.y + 14, this.dispatchMode ? `調度選牌 ${this.dispatchSelection.size}/2` : '共享手牌', '11px', '#9fc5cd');
    view.hand.forEach((card, index) => {
      const x = 245 + index * 160;
      const y = layout.hand.y + 112;
      const dispatchSelected = this.dispatchSelection.has(card.instanceId);
      const highlighted = card.selected || dispatchSelected;
      const rectangle = this.add.rectangle(x, y, 136, 138, highlighted ? 0x243b43 : 0x12222c, 1)
        .setStrokeStyle(highlighted ? 2 : 1, dispatchSelected ? 0xe1c371 : card.selected ? 0xd7bd78 : 0x8aa4ad, highlighted ? 0.95 : 0.5);
      this.addToContent(rectangle);
      this.addText(x, y - 34, card.name, '12px', '#edf3f2', 0.5);
      this.addText(x, y - 8, categoryDisplayName(card.category), '10px', '#9fc5cd', 0.5);
      this.addText(x, y + 20, `延遲 ${card.delay}`, '12px', '#e4c579', 0.5);
      this.addText(x, y + 43, targetRuleDisplayName(card.targetRule), '10px', '#aebfc2', 0.5);

      if (this.dispatchMode && view.canDispatch) {
        rectangle.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          if (dispatchSelected) this.dispatchSelection.delete(card.instanceId);
          else if (this.dispatchSelection.size < 2) this.dispatchSelection.add(card.instanceId);
          this.render();
        });
      } else if (view.phase === 'PLAYER_IDLE' || view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
        rectangle.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.selectCard(card.instanceId);
          this.render();
        });
      }
    });

    if (view.canDispatch && !this.dispatchMode) {
      this.drawButton(1110, layout.hand.y + 62, 144, 44, '調度', () => {
        this.dispatchMode = true;
        this.dispatchSelection.clear();
        this.render();
      });
    }

    if (this.dispatchMode && view.canDispatch) {
      this.drawButton(1110, layout.hand.y + 112, 144, 44, `提交調度 ${this.dispatchSelection.size} 張`, () => {
        this.runtime?.dispatch([...this.dispatchSelection]);
        this.dispatchSelection.clear();
        this.dispatchMode = false;
        this.render();
      });
      this.drawButton(1110, layout.hand.y + 164, 144, 34, '取消調度', () => {
        this.dispatchSelection.clear();
        this.dispatchMode = false;
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

    if (!this.dispatchMode && (view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW')) {
      this.drawButton(1110, layout.hand.y + 168, 144, 36, '取消', () => {
        this.runtime?.cancel();
        this.render();
      });
    }

    this.scheduleAutoAdvance(view);
  }

  private drawBattlefieldBackground(): void {
    const layout = REFACTOR_BATTLE_LAYOUT.battlefield;
    if (!this.textures.exists(REFACTOR_BATTLE_BACKGROUND_KEY)) return;
    const background = this.add.image(
      layout.x + layout.width / 2,
      layout.y + layout.height / 2,
      REFACTOR_BATTLE_BACKGROUND_KEY,
    ).setDisplaySize(layout.width, layout.height).setAlpha(0.64);
    this.addToContent(background);
  }

  private addFittedImage(
    x: number,
    y: number,
    textureKey: string,
    maxWidth: number,
    maxHeight: number,
    alpha = 1,
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, textureKey).setAlpha(alpha);
    const sourceWidth = Math.max(1, image.width);
    const sourceHeight = Math.max(1, image.height);
    image.setScale(Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight));
    this.addToContent(image);
    return image;
  }

  private scheduleAutoAdvance(view: RefactorBattleView): void {
    const action = autoAdvanceAction(view.phase, view.canResolveEnemy);
    if (action === 'NONE') return;
    const delay = action === 'RESOLVE_ENEMY' ? ENEMY_ACTION_DELAY_MS : NEXT_ACTOR_DELAY_MS;
    this.autoAdvanceTimer = this.time.delayedCall(delay, () => {
      if (!this.runtime) return;
      if (action === 'START_NEXT_ACTOR') this.runtime.startNextActor();
      else this.runtime.resolveActiveEnemyAction();
      this.render();
    });
  }

  private clearAutoAdvance(): void {
    this.autoAdvanceTimer?.remove(false);
    this.autoAdvanceTimer = undefined;
  }

  private drawPanel(rect: { x: number; y: number; width: number; height: number }, fill: number, stroke: number): void {
    this.addToContent(this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, fill, 0.96).setStrokeStyle(1, stroke, 0.35));
  }

  private drawButton(x: number, y: number, width: number, height: number, label: string, action: () => void): void {
    const button = this.add.rectangle(x, y, width, height, 0x2b251b, 1)
      .setStrokeStyle(1, 0xc4a361, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action);
    this.addToContent(button);
    this.addText(x, y, label, '12px', '#f0d69d', 0.5);
  }

  private addText(x: number, y: number, text: string, fontSize: string, color: string, origin = 0): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, { fontFamily: 'sans-serif', fontSize, color, lineSpacing: 4, align: origin === 0.5 ? 'center' : 'left' }).setOrigin(origin);
    this.addToContent(label);
    return label;
  }

  private addToContent<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.content?.add(object);
    return object;
  }
}
