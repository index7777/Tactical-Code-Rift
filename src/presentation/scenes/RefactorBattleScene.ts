import Phaser from 'phaser';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
  actionApproachPosition,
  perspectiveScaleForY,
} from '../battle/refactor/BattleActorPresenter';
import {
  REFACTOR_BATTLE_BACKGROUND_KEY,
  REFACTOR_SLASH_FX_KEY,
  actorBattleTextureKey,
  actorTimelineTextureKey,
  playerPoseTextureKey,
  queueRefactorBattleAssets,
} from '../battle/refactor/RefactorBattleAssets';
import {
  buildEnemyActionAnimationPlan,
  buildPlayerActionAnimationPlan,
  type RefactorBattleAnimationPlan,
} from '../battle/refactor/RefactorBattleAnimationPlan';
import {
  actorDisplayName,
  autoAdvanceAction,
  categoryDisplayName,
  phaseDisplayName,
  targetAffordance,
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
  private readonly actorSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly presentationTimers: Phaser.Time.TimerEvent[] = [];
  private animationBusy = false;

  constructor() {
    super('RefactorBattleScene');
  }

  preload(): void {
    queueRefactorBattleAssets(this.load);
  }

  create(): void {
    this.runtime = this.registry.get(RUNTIME_REGISTRY_KEY) as RefactorBattleRuntime | undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearPresentationMotion());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.clearPresentationMotion());
    this.render();
  }

  private render(): void {
    this.clearAutoAdvance();
    this.actorSprites.clear();
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    const layout = REFACTOR_BATTLE_LAYOUT;

    this.addToContent(this.add.rectangle(640, 360, layout.width, layout.height, 0x07101a, 1));
    this.drawBattlefieldBackground();
    this.drawOverlayPanel(layout.partyRail, 0x08151d, 0x739aa2, 0.72);
    this.drawOverlayPanel(layout.intentPanel, 0x121820, 0xb28f65, 0.76);

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

    this.addText(24, 16, phaseDisplayName(view.phase), '12px', '#d8e7e9');
    if (view.activeActorId) {
      this.addText(24, 38, `目前：${actorDisplayName(view.activeActorId)}`, '13px', '#e8ca7d');
    }

    view.timeline.forEach((node, index) => {
      const x = 210 + index * 146;
      const y = 48;
      const active = node.actorId === view.activeActorId;
      const fill = node.team === 'player' ? 0x17303d : 0x3a2325;
      const stroke = active ? 0xe6c96d : node.team === 'player' ? 0x8fb9c3 : 0xc48c83;
      const card = this.add.rectangle(x, y, 110, 74, fill, active ? 0.98 : 0.9)
        .setStrokeStyle(active ? 3 : 1, stroke, active ? 1 : 0.7);
      this.addToContent(card);

      const portraitKey = actorTimelineTextureKey(node.actorId);
      if (portraitKey && this.textures.exists(portraitKey)) {
        this.addFittedImage(x - 29, y - 6, portraitKey, 42, 42, active ? 1 : 0.92);
      } else {
        this.addText(x - 29, y - 5, actorDisplayName(node.actorId), '10px', '#eef5f3', 0.5);
      }
      this.addText(x - 2, y - 17, actorDisplayName(node.actorId), '10px', '#eef5f3');
      this.addText(x - 2, y + 4, `時點 ${node.nextActionAt}`, '10px', '#d8c98f');
      if (active) this.addText(x - 2, y + 23, '行動中', '9px', '#f0d98d');
    });

    const targetable = new Set(view.targetableActorIds);
    const selectedTargetId = view.preview?.targetId;
    for (const position of PLAYER_HOME_POSITIONS) {
      const vitals = view.vitalsByActorId[position.actorId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const isTargetable = targetable.has(position.actorId);
      const affordance = targetAffordance(alive, isTargetable, selectedTargetId === position.actorId);
      const ringRadius = 43 * position.perspectiveScale;
      const ring = this.add.circle(position.x, position.y, ringRadius, 0x0b1720, 0.12)
        .setStrokeStyle(
          affordance === 'SELECTED' ? 3 : affordance === 'CANDIDATE' ? 2 : 1,
          affordance === 'SELECTED'
            ? 0xe1c371
            : affordance === 'CANDIDATE'
              ? 0x86b9c4
              : alive
                ? 0x9ebbc1
                : 0x555d61,
          affordance === 'SELECTED' ? 0.98 : affordance === 'CANDIDATE' ? 0.62 : 0.3,
        );
      this.addToContent(ring);

      const textureKey = actorBattleTextureKey(position.actorId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actor = this.addFittedImage(
          position.x,
          position.y,
          textureKey,
          132 * position.perspectiveScale,
          118 * position.perspectiveScale,
          alive ? 1 : 0.42,
        );
        this.actorSprites.set(position.actorId, actor);
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
    }

    this.renderPartyStatus(view);

    const enemyIds = view.timeline
      .filter((node) => node.team === 'enemy')
      .map((node) => node.actorId)
      .filter((actorId, index, all) => all.indexOf(actorId) === index);
    enemyIds.forEach((enemyId, index) => {
      const x = 895 + index * 148;
      const y = 370 + (index % 2) * 54;
      const perspectiveScale = perspectiveScaleForY(y) * 1.08;
      const vitals = view.vitalsByActorId[enemyId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const isTargetable = targetable.has(enemyId);
      const affordance = targetAffordance(alive, isTargetable, selectedTargetId === enemyId);
      const ring = this.add.circle(x, y, 62 * perspectiveScale, 0x301a1d, 0.13)
        .setStrokeStyle(
          affordance === 'SELECTED' ? 3 : affordance === 'CANDIDATE' ? 2 : 1,
          affordance === 'SELECTED'
            ? 0xe1c371
            : affordance === 'CANDIDATE'
              ? 0xc59b92
              : 0xc18f86,
          affordance === 'SELECTED' ? 0.98 : affordance === 'CANDIDATE' ? 0.62 : 0.42,
        );
      this.addToContent(ring);

      const textureKey = actorBattleTextureKey(enemyId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actor = this.addFittedImage(x, y, textureKey, 172 * perspectiveScale, 154 * perspectiveScale, 1);
        this.actorSprites.set(enemyId, actor);
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

      this.addText(x, y + 76 * perspectiveScale, actorDisplayName(enemyId), '12px', '#f0dddd', 0.5);
      this.addText(x, y + 95 * perspectiveScale, vitals ? `生命 ${vitals.hp}/${vitals.maxHp}` : '--', '11px', '#dcb7af', 0.5);
    });

    this.addText(layout.intentPanel.x + 12, layout.intentPanel.y + 10, '敵方意圖', '10px', '#d8b98d');
    const intent = view.enemyIntents[0];
    if (intent) {
      this.addText(layout.intentPanel.x + 12, layout.intentPanel.y + 34, intent.name, '14px', '#f0ded0');
      const targets = intent.targetIds.map(actorDisplayName).join('、') || '—';
      this.addText(
        layout.intentPanel.x + 12,
        layout.intentPanel.y + 61,
        `目標 ${targets}\n傷害 ${intent.damage ?? 0} · 延遲 ${intent.delay}`,
        '11px',
        '#c7d8d9',
      );
    } else {
      this.addText(layout.intentPanel.x + 12, layout.intentPanel.y + 42, '—', '14px', '#899da2');
    }

    if (view.preview) {
      const previewX = 650;
      const previewY = 142;
      this.addToContent(
        this.add.rectangle(previewX, previewY, 430, 62, 0x071019, 0.82)
          .setStrokeStyle(1, view.preview.lethal ? 0xc56d65 : 0xd1b969, 0.78),
      );
      this.addText(
        previewX,
        previewY - 17,
        `預覽 · ${view.preview.targetId ? actorDisplayName(view.preview.targetId) : '—'}`,
        '11px',
        '#e8ca7d',
        0.5,
      );
      this.addText(
        previewX,
        previewY + 8,
        `傷害 ${view.preview.finalDamage} · 生命 ${view.preview.hpBefore ?? '—'}→${view.preview.hpAfter ?? '—'} · 延遲 +${view.preview.actualDelay} · 行動窗口 +${view.preview.crossedPlayerWindows}`,
        '12px',
        view.preview.lethal ? '#f29a8f' : '#dce9e7',
        0.5,
      );
    }

    this.addText(24, layout.hand.y + 14, this.dispatchMode ? `調度選牌 ${this.dispatchSelection.size}/2` : '共享手牌', '11px', '#9fc5cd');
    view.hand.forEach((card, index) => {
      const x = 245 + index * 160;
      const y = layout.hand.y + 112;
      const dispatchSelected = this.dispatchSelection.has(card.instanceId);
      const highlighted = card.selected || dispatchSelected;
      const rectangle = this.add.rectangle(x, y, 136, 138, highlighted ? 0x243b43 : 0x12222c, 0.94)
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
        this.playPlayerAction(view);
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

  private renderPartyStatus(view: RefactorBattleView): void {
    const layout = REFACTOR_BATTLE_LAYOUT.partyRail;
    this.addText(layout.x + 10, layout.y + 9, '隊伍', '10px', '#9fc5cd');
    PLAYER_HOME_POSITIONS.forEach((position, index) => {
      const vitals = view.vitalsByActorId[position.actorId];
      this.addText(
        layout.x + 10,
        layout.y + 34 + index * 32,
        `${actorDisplayName(position.actorId)}  ${vitals ? `${vitals.hp}/${vitals.maxHp}` : '--'}`,
        '10px',
        vitals && vitals.hp > 0 ? '#c8dcdc' : '#737d81',
      );
    });
  }

  private playPlayerAction(view: RefactorBattleView): void {
    if (!this.runtime || this.animationBusy) return;
    const plan = buildPlayerActionAnimationPlan(view);
    if (!plan) {
      this.runtime.confirmCard();
      this.runtime.resolveConfirmedPlayerAction();
      this.render();
      return;
    }

    const actor = this.actorSprites.get(plan.actorId);
    if (!actor) {
      this.runtime.confirmCard();
      this.runtime.resolveConfirmedPlayerAction();
      this.render();
      return;
    }

    this.beginPresentationMotion();
    this.runtime.confirmCard();

    const originX = actor.x;
    const originY = actor.y;
    const destination = this.presentationDestination(plan);
    this.setPlayerPose(plan.actorId, 'ready');

    this.tweens.add({
      targets: actor,
      x: destination.x,
      y: destination.y,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (plan.useAttackPose) this.setPlayerPose(plan.actorId, 'attack-a');
        this.queuePresentationDelay(70, () => {
          if (plan.useAttackPose) this.setPlayerPose(plan.actorId, 'attack-b');
          this.queuePresentationDelay(90, () => {
            if (plan.useSlashFx) this.playSlashFx(plan.targetId);
            if (plan.motion !== 'REACTION') this.playTargetReaction(plan.targetId);
            this.runtime?.resolveConfirmedPlayerAction();
            this.queuePresentationDelay(120, () => {
              this.tweens.add({
                targets: actor,
                x: originX,
                y: originY,
                duration: 210,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  this.setPlayerPose(plan.actorId, 'idle-a');
                  this.finishPresentationMotion();
                  this.render();
                },
              });
            });
          });
        });
      },
    });
  }

  private playEnemyAction(view: RefactorBattleView): void {
    if (!this.runtime || this.animationBusy) return;
    const plan = buildEnemyActionAnimationPlan(view);
    if (!plan) {
      this.runtime.resolveActiveEnemyAction();
      this.render();
      return;
    }

    const actor = this.actorSprites.get(plan.actorId);
    if (!actor) {
      this.runtime.resolveActiveEnemyAction();
      this.render();
      return;
    }

    this.beginPresentationMotion();
    const originX = actor.x;
    const originY = actor.y;
    const originScaleX = actor.scaleX;
    const originScaleY = actor.scaleY;
    const target = plan.targetId ? this.actorSprites.get(plan.targetId) : undefined;
    const destinationX = target ? Math.max(610, target.x + 165) : Math.max(640, originX - 150);
    const destinationY = target ? target.y : originY;

    this.tweens.add({
      targets: actor,
      x: destinationX,
      y: destinationY,
      scaleX: originScaleX * 1.04,
      scaleY: originScaleY * 1.04,
      duration: 190,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (plan.useSlashFx) this.playSlashFx(plan.targetId);
        this.playTargetReaction(plan.targetId);
        this.runtime?.resolveActiveEnemyAction();
        this.queuePresentationDelay(140, () => {
          this.tweens.add({
            targets: actor,
            x: originX,
            y: originY,
            scaleX: originScaleX,
            scaleY: originScaleY,
            duration: 220,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              this.finishPresentationMotion();
              this.render();
            },
          });
        });
      },
    });
  }

  private presentationDestination(plan: RefactorBattleAnimationPlan): { x: number; y: number } {
    const actor = this.actorSprites.get(plan.actorId);
    const target = plan.targetId ? this.actorSprites.get(plan.targetId) : undefined;

    if (plan.motion === 'ACTION' && actor && target) {
      return actionApproachPosition(
        {
          x: actor.x,
          y: actor.y,
          width: actor.displayWidth,
          height: actor.displayHeight,
        },
        {
          x: target.x,
          y: target.y,
          width: target.displayWidth,
          height: target.displayHeight,
        },
      );
    }

    if (plan.motion === 'REACTION' && target) {
      return {
        x: Math.min(720, target.x + 92),
        y: target.y - 8,
      };
    }

    return plan.motion === 'REACTION'
      ? { ...REFACTOR_BATTLE_LAYOUT.reactionPosition }
      : { ...REFACTOR_BATTLE_LAYOUT.actionPosition };
  }

  private setPlayerPose(
    actorId: string,
    pose: 'idle-a' | 'ready' | 'attack-a' | 'attack-b' | 'hit-a' | 'hit-b',
  ): void {
    const image = this.actorSprites.get(actorId);
    const textureKey = playerPoseTextureKey(actorId, pose);
    if (!image || !textureKey || !this.textures.exists(textureKey)) return;
    const width = image.displayWidth;
    const height = image.displayHeight;
    image.setTexture(textureKey).setDisplaySize(width, height);
  }

  private playTargetReaction(targetId?: string): void {
    if (!targetId) return;
    const target = this.actorSprites.get(targetId);
    if (!target) return;

    const hitA = playerPoseTextureKey(targetId, 'hit-a');
    const hitB = playerPoseTextureKey(targetId, 'hit-b');
    if (hitA && this.textures.exists(hitA)) {
      this.setPlayerPose(targetId, 'hit-a');
      if (hitB && this.textures.exists(hitB)) {
        this.queuePresentationDelay(90, () => this.setPlayerPose(targetId, 'hit-b'));
      }
      this.queuePresentationDelay(190, () => this.setPlayerPose(targetId, 'idle-a'));
      return;
    }

    target.setTint(0xffb0a8);
    this.queuePresentationDelay(150, () => {
      if (target.active) target.clearTint();
    });
  }

  private playSlashFx(targetId?: string): void {
    if (!this.textures.exists(REFACTOR_SLASH_FX_KEY)) return;
    const target = targetId ? this.actorSprites.get(targetId) : undefined;
    const x = target?.x ?? REFACTOR_BATTLE_LAYOUT.actionPosition.x + 70;
    const y = target?.y ?? REFACTOR_BATTLE_LAYOUT.actionPosition.y;
    const fx = this.addFittedImage(x, y, REFACTOR_SLASH_FX_KEY, 128, 96, 0.92)
      .setRotation(-0.2);
    this.tweens.add({
      targets: fx,
      alpha: 0,
      scaleX: fx.scaleX * 1.18,
      scaleY: fx.scaleY * 1.18,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => fx.destroy(),
    });
  }

  private beginPresentationMotion(): void {
    this.clearAutoAdvance();
    this.animationBusy = true;
    this.input.enabled = false;
  }

  private finishPresentationMotion(): void {
    for (const timer of this.presentationTimers.splice(0)) timer.remove(false);
    this.animationBusy = false;
    this.input.enabled = true;
  }

  private clearPresentationMotion(): void {
    this.clearAutoAdvance();
    for (const timer of this.presentationTimers.splice(0)) timer.remove(false);
    this.tweens.killAll();
    this.animationBusy = false;
    if (this.input) this.input.enabled = true;
  }

  private queuePresentationDelay(delay: number, callback: () => void): void {
    const timer = this.time.delayedCall(delay, callback);
    this.presentationTimers.push(timer);
  }

  private drawBattlefieldBackground(): void {
    const layout = REFACTOR_BATTLE_LAYOUT.battlefield;
    if (!this.textures.exists(REFACTOR_BATTLE_BACKGROUND_KEY)) return;
    const background = this.add.image(
      layout.x + layout.width / 2,
      layout.y + layout.height / 2,
      REFACTOR_BATTLE_BACKGROUND_KEY,
    ).setDisplaySize(layout.width, layout.height);
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
    if (this.animationBusy) return;
    const action = autoAdvanceAction(view.phase, view.canResolveEnemy);
    if (action === 'NONE') return;
    const delay = action === 'RESOLVE_ENEMY' ? ENEMY_ACTION_DELAY_MS : NEXT_ACTOR_DELAY_MS;
    this.autoAdvanceTimer = this.time.delayedCall(delay, () => {
      if (!this.runtime || this.animationBusy) return;
      if (action === 'START_NEXT_ACTOR') {
        this.runtime.startNextActor();
        this.render();
      } else {
        this.playEnemyAction(view);
      }
    });
  }

  private clearAutoAdvance(): void {
    this.autoAdvanceTimer?.remove(false);
    this.autoAdvanceTimer = undefined;
  }

  private drawOverlayPanel(
    rect: { x: number; y: number; width: number; height: number },
    fill: number,
    stroke: number,
    alpha: number,
  ): void {
    this.addToContent(
      this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, fill, alpha)
        .setStrokeStyle(1, stroke, 0.3),
    );
  }

  private drawButton(x: number, y: number, width: number, height: number, label: string, action: () => void): void {
    const button = this.add.rectangle(x, y, width, height, 0x2b251b, 0.96)
      .setStrokeStyle(1, 0xc4a361, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action);
    this.addToContent(button);
    this.addText(x, y, label, '12px', '#f0d69d', 0.5);
  }

  private addText(x: number, y: number, text: string, fontSize: string, color: string, origin = 0): Phaser.GameObjects.Text {
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
