import Phaser from 'phaser';
import { battleExitDecision, type BattleOutcome } from '../../application/battle/BattleExitPolicy';
import { createEncounterBattleBootstrap } from '../../application/battle/createEncounterBattleBootstrap';
import { storyEncounter, type EncounterBattlefield } from '../../core/route/EncounterCatalog';
import {
  PLAYER_HOME_POSITIONS,
  REFACTOR_BATTLE_LAYOUT,
  actionApproachPosition,
  homePositionFor,
} from '../battle/refactor/BattleActorPresenter';
import {
  backgroundFrame,
  enemyStagePosition,
} from '../battle/refactor/BattleStageProfile';
import {
  REFACTOR_BATTLE_BACKGROUND_KEYS,
  REFACTOR_BOSS_MUSIC_KEY,
  REFACTOR_BATTLE_MUSIC_KEY,
  REFACTOR_IMPACT_SFX_KEY,
  REFACTOR_CARD_FRAME_KEY,
  REFACTOR_SWISH_SFX_KEY,
  actorBattleTextureKey,
  actorTimelineTextureKey,
  playerPoseTextureKey,
  queueRefactorBattleAssets,
  refactorCardFamilyTextureKey,
} from '../battle/refactor/RefactorBattleAssets';
import {
  buildEnemyActionAnimationPlan,
  buildPlayerActionAnimationPlan,
  type RefactorBattleAnimationPlan,
} from '../battle/refactor/RefactorBattleAnimationPlan';
import {
  focusCameraTarget,
  focusedActorPosition,
  focusedPlayerActorId,
} from '../battle/refactor/RefactorBattleFocusPolicy';
import {
  cardFamilyStyle,
  cardSelectionPresentation,
} from '../battle/refactor/CardMasterPresentation';
import { cardContentLayout } from '../battle/refactor/CardContentLayout';
import {
  handLayoutMetrics,
  type RefactorHandLayoutMetrics,
} from '../battle/refactor/RefactorHandLayoutPolicy';
import {
  actorDisplayName,
  autoAdvanceAction,
  phaseDisplayName,
  shouldShowActorRing,
  targetAffordance,
} from '../battle/refactor/RefactorBattlePresentationPolicy';
import { RefactorBattleRuntime, type RefactorBattleView } from '../battle/refactor/RefactorBattleRuntime';

const NEXT_ACTOR_DELAY_MS = 420;
const ENEMY_ACTION_DELAY_MS = 720;
const ACTIVE_FOCUS_DURATION_MS = 220;
const OTHER_PLAYER_FOCUS_ALPHA = 0.76;

type RenderLayer = 'world' | 'hud';

export class RefactorBattleScene extends Phaser.Scene {
  private runtime?: RefactorBattleRuntime;
  private worldContent?: Phaser.GameObjects.Container;
  private hudContent?: Phaser.GameObjects.Container;
  private hudCamera?: Phaser.Cameras.Scene2D.Camera;
  private battleMusic?: Phaser.Sound.BaseSound;
  private dispatchMode = false;
  private readonly dispatchSelection = new Set<string>();
  private autoAdvanceTimer?: Phaser.Time.TimerEvent;
  private readonly actorSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly actorRings = new Map<string, Phaser.GameObjects.Ellipse>();
  private readonly presentationTimers: Phaser.Time.TimerEvent[] = [];
  private focusedActorId?: string;
  private animationBusy = false;
  private journeyNodeId = 'battle-1';
  private battlefield: EncounterBattlefield = 'rail-halt';
  private selectedMusicKey = REFACTOR_BATTLE_MUSIC_KEY;
  private resultShown = false;
  private qaOutcome?: BattleOutcome;
  private enemySpawnIds: string[] = [];

  constructor() {
    super('RefactorBattleScene');
  }

  init(data?: { journeyNodeId?: string }): void {
    const qaBattleNodeId = new URLSearchParams(window.location.search).get('qa-battle') ?? undefined;
    const requestedQaOutcome = new URLSearchParams(window.location.search).get('qa-outcome');
    this.qaOutcome = requestedQaOutcome === 'victory' || requestedQaOutcome === 'defeat'
      ? requestedQaOutcome
      : undefined;
    this.journeyNodeId = data?.journeyNodeId ?? qaBattleNodeId ?? 'battle-1';
    const encounter = storyEncounter(this.journeyNodeId);
    if (!encounter) throw new Error(`unknown battle node: ${this.journeyNodeId}`);
    this.battlefield = encounter.battlefield;
    this.enemySpawnIds = [...encounter.enemies];
    this.selectedMusicKey = this.journeyNodeId.startsWith('boss-')
      ? REFACTOR_BOSS_MUSIC_KEY
      : REFACTOR_BATTLE_MUSIC_KEY;
    const bootstrap = createEncounterBattleBootstrap(this.journeyNodeId);
    this.runtime = new RefactorBattleRuntime(bootstrap.controller, bootstrap.enemyIntentProvider);
    this.resultShown = false;
  }

  preload(): void {
    queueRefactorBattleAssets(this.load);
  }

  create(): void {
    this.configureCameras();
    this.ensureBattleMusic();
    this.input.once('pointerdown', () => this.ensureBattleMusic());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupScenePresentation());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupScenePresentation());
    this.render();
  }

  private configureCameras(): void {
    this.cameras.main.setZoom(1).centerOn(640, 360);
    this.hudCamera = this.cameras.add(0, 0, REFACTOR_BATTLE_LAYOUT.width, REFACTOR_BATTLE_LAYOUT.height, false, 'RefactorBattleHud');
    this.hudCamera.setZoom(1).centerOn(640, 360);
  }

  private render(): void {
    this.clearAutoAdvance();
    this.actorSprites.clear();
    this.actorRings.clear();
    this.worldContent?.destroy(true);
    this.hudContent?.destroy(true);
    this.worldContent = this.add.container(0, 0);
    this.hudContent = this.add.container(0, 0);
    this.cameras.main.ignore(this.hudContent);
    this.hudCamera?.ignore(this.worldContent);
    const layout = REFACTOR_BATTLE_LAYOUT;

    this.addToWorld(this.add.rectangle(640, 360, layout.width, layout.height, 0x07101a, 1));
    this.drawBattlefieldBackground();
    this.drawOverlayPanel(layout.partyRail, 0x08151d, 0x739aa2, 0.64);

    if (!this.runtime) {
      this.resetWorldCamera(0);
      this.addText(640, 336, '新版戰鬥執行環境未連接', '18px', '#e5c98d', 0.5);
      this.addText(640, 370, '此場景保持停用，不建立模擬戰鬥狀態。', '14px', '#a9c2c7', 0.5);
      return;
    }

    this.renderView(this.runtime.view());
  }

  private renderView(view: RefactorBattleView): void {
    if (!view.canDispatch) {
      this.dispatchMode = false;
      this.dispatchSelection.clear();
    }
    const handLayout = handLayoutMetrics(view.phase, this.dispatchMode);

    this.publishQaState(view);
    const outcome = this.qaOutcome ?? view.outcome;
    if (outcome) {
      this.showBattleResult(outcome);
      return;
    }

    const focusActorId = focusedPlayerActorId(view.phase, view.activeActorId, view.timeline);
    const enteringFocus = Boolean(focusActorId && focusActorId !== this.focusedActorId);

    this.addText(24, 32, phaseDisplayName(view.phase), '11px', '#d8e7e9');
    if (view.activeActorId) {
      this.addText(24, 52, `目前：${actorDisplayName(view.activeActorId)}`, '12px', '#e8ca7d');
    }

    view.timeline.forEach((node, index) => {
      const x = 210 + index * 146;
      const y = 64;
      const active = node.actorId === view.activeActorId;
      const fill = node.team === 'player' ? 0x17303d : 0x3a2325;
      const stroke = active ? 0xe6c96d : node.team === 'player' ? 0x8fb9c3 : 0xc48c83;
      const card = this.add.rectangle(x, y, 108, 66, fill, active ? 0.98 : 0.86)
        .setStrokeStyle(active ? 3 : 1, stroke, active ? 1 : 0.62);
      this.addToHud(card);

      const portraitKey = actorTimelineTextureKey(node.actorId);
      if (portraitKey && this.textures.exists(portraitKey)) {
        this.addFittedImage(x - 28, y - 5, portraitKey, 38, 38, active ? 1 : 0.9, 'hud');
      } else {
        this.addText(x - 28, y - 4, actorDisplayName(node.actorId), '9px', '#eef5f3', 0.5);
      }
      this.addText(x - 1, y - 15, actorDisplayName(node.actorId), '9px', '#eef5f3');
      this.addText(x - 1, y + 4, `時點 ${node.nextActionAt}`, '9px', '#d8c98f');
      if (active) this.addText(x - 1, y + 21, '行動中', '8px', '#f0d98d');
    });

    const targetable = new Set(view.targetableActorIds);
    const selectedTargetId = view.preview?.targetId;
    for (const position of PLAYER_HOME_POSITIONS) {
      const vitals = view.vitalsByActorId[position.actorId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const isTargetable = targetable.has(position.actorId);
      const isFocused = focusActorId === position.actorId;
      const displayPosition = focusedActorPosition(position.x, position.y, isFocused && !enteringFocus);
      const affordance = targetAffordance(alive, isTargetable, selectedTargetId === position.actorId);
      let ring: Phaser.GameObjects.Ellipse | undefined;

      if (shouldShowActorRing(affordance, isFocused)) {
        const focusMarker = this.add.ellipse(
          displayPosition.x,
          displayPosition.y + 3,
          58 * position.perspectiveScale,
          14 * position.perspectiveScale,
          0xe0cf92,
          0.08,
        ).setStrokeStyle(1, 0xe0cf92, 0.58);
        ring = focusMarker;
        this.addToWorld(focusMarker);
        this.actorRings.set(position.actorId, focusMarker);
      }

      if (affordance === 'SELECTED') {
        this.addText(displayPosition.x, displayPosition.y - 66 * position.perspectiveScale, '◆', '14px', '#f0d477', 0.5, 'world')
          .setDepth(2100 + Math.round(displayPosition.y));
      }

      const textureKey = actorBattleTextureKey(position.actorId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actorAlpha = !alive
          ? 0.42
          : focusActorId && !isFocused
            ? OTHER_PLAYER_FOCUS_ALPHA
            : 1;
        const actor = this.addFittedImage(
          displayPosition.x,
          displayPosition.y,
          textureKey,
          132 * position.perspectiveScale,
          118 * position.perspectiveScale,
          actorAlpha,
          'world',
        );
        actor.setDepth(Math.round(displayPosition.y));
        ring?.setDepth(Math.round(displayPosition.y) - 2);
        this.actorSprites.set(position.actorId, actor);
        if (isTargetable) {
          actor.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.runtime?.previewTarget(position.actorId);
            this.render();
          });
        }
      }
    }

    this.renderPartyStatus(view);

    const enemyIds = this.enemySpawnIds;
    enemyIds.forEach((enemyId, index) => {
      const enemyPosition = enemyStagePosition(index, enemyIds.length);
      const { x, y, perspectiveScale } = enemyPosition;
      const vitals = view.vitalsByActorId[enemyId];
      const alive = Boolean(vitals && vitals.hp > 0);
      const isTargetable = targetable.has(enemyId);
      const affordance = targetAffordance(alive, isTargetable, selectedTargetId === enemyId);
      const textureKey = actorBattleTextureKey(enemyId);
      if (textureKey && this.textures.exists(textureKey)) {
        const actor = this.addFittedImage(x, y, textureKey, 172 * perspectiveScale, 154 * perspectiveScale, 1, 'world');
        actor.setDepth(Math.round(y));
        this.actorSprites.set(enemyId, actor);
        if (isTargetable) {
          actor.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.runtime?.previewTarget(enemyId);
            this.render();
          });
        }
      }

      const overheadY = y - 92 * perspectiveScale;
      const intent = view.enemyIntents.find((candidate) => candidate.enemyId === enemyId);
      const overheadDepth = 2000 + Math.round(y);
      const overheadStroke = affordance === 'SELECTED' ? 0xe1c371 : affordance === 'CANDIDATE' ? 0xc87984 : 0xb65d69;
      const overheadStrokeAlpha = affordance === 'SELECTED' ? 1 : affordance === 'CANDIDATE' ? 0.86 : 0.7;
      this.addToWorld(this.add.rectangle(x, overheadY, 132, 42, 0x100b10, 0.82).setStrokeStyle(affordance === 'SELECTED' ? 2 : 1, overheadStroke, overheadStrokeAlpha).setDepth(overheadDepth));
      if (affordance === 'SELECTED') {
        this.addText(x, overheadY - 29, '◆', '14px', '#f0d477', 0.5, 'world').setDepth(overheadDepth + 2);
      }
      this.addText(x - 60, overheadY - 15, actorDisplayName(enemyId), '9px', '#f0dddd', 0, 'world').setDepth(overheadDepth + 1);
      this.addText(x + 60, overheadY - 15, intent?.name ?? '—', '8px', '#e1b6aa', 1, 'world').setDepth(overheadDepth + 1);
      this.addToWorld(this.add.rectangle(x, overheadY + 4, 116, 7, 0x2b1b20, 1).setDepth(overheadDepth + 1));
      const hpRatio = vitals ? Math.max(0, vitals.hp / vitals.maxHp) : 0;
      this.addToWorld(this.add.rectangle(x - 58, overheadY + 4, 116 * hpRatio, 7, 0xd45168, 1).setOrigin(0, 0.5).setDepth(overheadDepth + 2));
      this.addText(x, overheadY + 15, vitals ? `${vitals.hp}/${vitals.maxHp}` : '--', '8px', '#f2dfe1', 0.5, 'world').setDepth(overheadDepth + 2);
    });
    this.worldContent?.sort('depth');

    if (view.preview) {
      const previewX = 650;
      const previewY = handLayout.previewY;
      this.addToHud(
        this.add.rectangle(previewX, previewY, 410, 50, 0x071019, 0.78)
          .setStrokeStyle(1, view.preview.lethal ? 0xc56d65 : 0xd1b969, 0.72),
      );
      this.addText(
        previewX,
        previewY - 13,
        `預覽 · ${view.preview.targetId ? actorDisplayName(view.preview.targetId) : '—'}`,
        '10px',
        '#e8ca7d',
        0.5,
      );
      this.addText(
        previewX,
        previewY + 7,
        `傷害 ${view.preview.finalDamage} · 生命 ${view.preview.hpBefore ?? '—'}→${view.preview.hpAfter ?? '—'} · 延遲 +${view.preview.actualDelay} · 窗口 +${view.preview.crossedPlayerWindows}`,
        '10px',
        view.preview.lethal ? '#f29a8f' : '#dce9e7',
        0.5,
      );
    }

    this.drawSharedHand(view, handLayout);

    this.updateActiveActorFocus(focusActorId, enteringFocus);
    this.scheduleAutoAdvance(view);
  }

  private drawSharedHand(view: RefactorBattleView, handLayout: RefactorHandLayoutMetrics): void {
    if (handLayout.state === 'HIDDEN') return;
    const anySkillSelected = view.hand.some((card) => card.selected);
    this.addText(
      24,
      handLayout.labelY,
      this.dispatchMode ? `調度選牌 ${this.dispatchSelection.size}/2` : '共享手牌',
      '10px',
      '#9fc5cd',
    );

    const orderedHand = view.hand.map((card, index) => ({ card, index }))
      .sort((left, right) => Number(left.card.selected) - Number(right.card.selected));
    orderedHand.forEach(({ card, index }) => {
      const baseX = 248 + index * handLayout.cardGap;
      const dispatchSelected = this.dispatchSelection.has(card.instanceId);
      const family = cardFamilyStyle(card.category);
      const presentation = cardSelectionPresentation(card.selected, dispatchSelected, anySkillSelected);
      const selectedFocus = card.selected && (handLayout.state === 'FOCUS' || handLayout.state === 'TARGETING');
      const x = selectedFocus ? 640 : baseX;
      const focusScale = selectedFocus ? 1.5 : 1;
      const width = handLayout.cardWidth * focusScale;
      const height = handLayout.cardHeight * focusScale;
      const y = selectedFocus ? 500 : handLayout.cardY;
      const cardAlpha = selectedFocus ? 1 : anySkillSelected ? 0.42 : presentation.alpha;
      const content = cardContentLayout(x, y, width, height);

      if (card.selected) {
        this.addToHud(
          this.add.rectangle(x, y, width + 10, height + 10, family.accent, 0.045)
            .setStrokeStyle(2, family.accent, presentation.glowAlpha * 0.72),
        );
      }

      const cardRect = this.add.rectangle(x, y, width, height, family.fill, cardAlpha)
        .setStrokeStyle(presentation.strokeWidth, family.stroke, presentation.glowAlpha);
      this.addToHud(cardRect);

      const familyKey = refactorCardFamilyTextureKey(card.category);
      if (this.textures.exists(REFACTOR_CARD_FRAME_KEY)) {
        this.addToHud(this.add.image(x, y, REFACTOR_CARD_FRAME_KEY).setDisplaySize(width, height).setAlpha(cardAlpha));
      }
      if (this.textures.exists(familyKey)) {
        this.addFittedImage(
          content.art.x,
          content.art.y,
          familyKey,
          content.art.width,
          content.art.height,
          cardAlpha,
          'hud',
        );
      }

      const accentBar = this.add.rectangle(
        x,
        y - height / 2 + 4,
        width - 8,
        6,
        family.accent,
        card.selected ? 0.95 : 0.62,
      );
      this.addToHud(accentBar);

      const mark = this.add.rectangle(
        content.familyBadge.x,
        content.familyBadge.y,
        content.familyBadge.size,
        content.familyBadge.size,
        family.accent,
        card.selected ? 0.24 : 0.12,
      )
        .setRotation(Math.PI / 4)
        .setStrokeStyle(1, family.accent, card.selected ? 0.9 : 0.55);
      this.addToHud(mark);
      this.addText(
        content.familyBadge.x,
        content.familyBadge.y,
        family.label.slice(0, 1),
        selectedFocus ? '9px' : '7px',
        family.text,
        0.5,
      );
      this.addText(
        content.title.x,
        content.title.y,
        card.name,
        selectedFocus ? '14px' : '10px',
        '#f4f5f2',
        0.5,
      ).setWordWrapWidth(content.title.maxWidth, true);

      const effectLines = selectedFocus || handLayout.state === 'DISPATCH' ? card.effectLines : [];
      effectLines.forEach((line, lineIndex) => {
        this.addText(
          content.effect.x,
          content.effect.firstLineY + lineIndex * content.effect.lineGap,
          line,
          selectedFocus ? '11px' : '9px',
          card.selected ? '#edf1ef' : '#b8c7c8',
          0.5,
        ).setWordWrapWidth(content.effect.maxWidth, true);
      });

      const footer = this.add.rectangle(
        content.footer.x,
        content.footer.y,
        content.footer.width,
        content.footer.height,
        0x070c12,
        0.9,
      )
        .setStrokeStyle(1, family.stroke, card.selected ? 0.86 : 0.42);
      this.addToHud(footer);
      this.addText(
        content.footer.x,
        content.footer.y,
        `${family.label}  ·  Delay ${card.delay}`,
        selectedFocus ? '11px' : '8px',
        '#f1d687',
        0.5,
      );

      if (dispatchSelected) {
        this.addText(x + width / 2 - 7, y - height / 2 + 13, '調度', '8px', '#f4d98b', 1);
      }

      if (this.dispatchMode && view.canDispatch) {
        cardRect.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          if (dispatchSelected) this.dispatchSelection.delete(card.instanceId);
          else if (this.dispatchSelection.size < 2) this.dispatchSelection.add(card.instanceId);
          this.render();
        });
      } else if (view.phase === 'PLAYER_IDLE' || view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
        cardRect.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.runtime?.selectCard(card.instanceId);
          this.render();
        });
      }
    });

    this.drawHandUtility(view, handLayout);
  }

  private drawHandUtility(view: RefactorBattleView, handLayout: RefactorHandLayoutMetrics): void {
    const x = handLayout.utilityX;
    const y = handLayout.utilityY;
    const width = handLayout.utilityWidth;
    const height = handLayout.utilityHeight;

    if (this.dispatchMode && view.canDispatch) {
      this.addToHud(
        this.add.rectangle(x, y, width, height, 0x201b13, 0.92)
          .setStrokeStyle(2, 0xc4a361, 0.82),
      );
      this.addText(x, y - height * 0.31, '調度', '14px', '#f0d69d', 0.5);
      this.addText(x, y - height * 0.12, `已選 ${this.dispatchSelection.size}/2`, '10px', '#d9c58d', 0.5);
      this.addText(x, y + height * 0.02, '交換手牌', '9px', '#aebfc2', 0.5);
      this.drawButton(x, handLayout.actionPrimaryY, width - 12, 34, '提交調度', () => {
        this.runtime?.dispatch([...this.dispatchSelection]);
        this.dispatchSelection.clear();
        this.dispatchMode = false;
        this.render();
      });
      this.drawButton(x, handLayout.actionSecondaryY, width - 12, 28, '取消', () => {
        this.dispatchSelection.clear();
        this.dispatchMode = false;
        this.render();
      });
      return;
    }

    if (view.phase === 'CARD_SELECTED' || view.phase === 'TARGET_PREVIEW') {
      const selected = view.hand.find((card) => card.selected);
      this.addToHud(
        this.add.rectangle(x, y, width, height, 0x1c1528, 0.92)
          .setStrokeStyle(2, 0x9c72c9, 0.78),
      );
      this.addText(x, y - height * 0.31, '行動', '12px', '#dec8ef', 0.5);
      this.addText(x, y - height * 0.14, selected?.name ?? '—', '11px', '#f0e7f5', 0.5);
      this.addText(x, y + height * 0.01, view.canConfirm ? '目標已確認' : '選擇目標', '9px', '#bda9ca', 0.5);
      if (view.canConfirm) {
        this.drawButton(x, handLayout.actionPrimaryY, width - 12, 34, '確認執行', () => {
          this.playPlayerAction(view);
        });
      }
      this.drawButton(x, handLayout.actionSecondaryY, width - 12, 28, '取消', () => {
        this.runtime?.cancel();
        this.render();
      });
      return;
    }

    if (view.canDispatch) {
      const panel = this.add.rectangle(x, y, width, height, 0x191a18, 0.9)
        .setStrokeStyle(1, 0x8d8065, 0.62)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.dispatchMode = true;
          this.dispatchSelection.clear();
          this.render();
        });
      this.addToHud(panel);
      this.addText(x, y - height * 0.26, '調度', '13px', '#e6d4aa', 0.5);
      this.addText(x, y - height * 0.02, '交換 0–2 張', '9px', '#aebfc2', 0.5);
      this.addText(x, y + height * 0.18, 'Delay 3', '10px', '#d9bd77', 0.5);
    }
  }

  private renderPartyStatus(view: RefactorBattleView): void {
    const layout = REFACTOR_BATTLE_LAYOUT.partyRail;
    this.addText(layout.x + 9, layout.y + 8, '隊伍', '9px', '#9fc5cd');
    PLAYER_HOME_POSITIONS.forEach((position, index) => {
      const vitals = view.vitalsByActorId[position.actorId];
      this.addText(
        layout.x + 9,
        layout.y + 29 + index * 24,
        `${actorDisplayName(position.actorId)}  ${vitals ? `${vitals.hp}/${vitals.maxHp}` : '--'}`,
        '9px',
        vitals && vitals.hp > 0 ? '#c8dcdc' : '#737d81',
      );
    });
  }

  private updateActiveActorFocus(focusActorId: string | undefined, enteringFocus: boolean): void {
    if (!focusActorId) {
      if (this.focusedActorId) this.resetWorldCamera(ACTIVE_FOCUS_DURATION_MS);
      this.focusedActorId = undefined;
      return;
    }

    const actor = this.actorSprites.get(focusActorId);
    const ring = this.actorRings.get(focusActorId);
    if (!actor) return;

    const cameraTarget = focusCameraTarget(actor.x, actor.y);
    if (enteringFocus) {
      const home = homePositionFor(focusActorId as 'rin' | 'chikage' | 'oboro' | 'mo');
      const stepped = focusedActorPosition(home.x, home.y, true);
      this.tweens.add({
        targets: [actor, ...(ring ? [ring] : [])],
        x: stepped.x,
        y: stepped.y,
        duration: ACTIVE_FOCUS_DURATION_MS,
        ease: 'Sine.easeOut',
      });
      this.cameras.main.pan(cameraTarget.x, cameraTarget.y, ACTIVE_FOCUS_DURATION_MS, 'Sine.easeOut');
      this.cameras.main.zoomTo(cameraTarget.zoom, ACTIVE_FOCUS_DURATION_MS, 'Sine.easeOut');
    } else if (Math.abs(this.cameras.main.zoom - cameraTarget.zoom) > 0.001) {
      this.cameras.main.centerOn(cameraTarget.x, cameraTarget.y);
      this.cameras.main.setZoom(cameraTarget.zoom);
    }

    this.focusedActorId = focusActorId;
  }

  private resetWorldCamera(duration: number): void {
    if (duration <= 0) {
      this.cameras.main.setZoom(1).centerOn(640, 360);
      return;
    }
    this.cameras.main.pan(640, 360, duration, 'Sine.easeInOut');
    this.cameras.main.zoomTo(1, duration, 'Sine.easeInOut');
  }

  private playPlayerAction(view: RefactorBattleView): void {
    if (!this.runtime || this.animationBusy) return;
    const plan = buildPlayerActionAnimationPlan(view);
    if (!plan) {
      this.runtime.confirmCard();
      this.runtime.resolveConfirmedPlayerAction();
      this.focusedActorId = undefined;
      this.resetWorldCamera(ACTIVE_FOCUS_DURATION_MS);
      this.render();
      return;
    }

    const actor = this.actorSprites.get(plan.actorId);
    if (!actor) {
      this.runtime.confirmCard();
      this.runtime.resolveConfirmedPlayerAction();
      this.focusedActorId = undefined;
      this.resetWorldCamera(ACTIVE_FOCUS_DURATION_MS);
      this.render();
      return;
    }

    this.beginPresentationMotion();
    this.runtime.confirmCard();

    const home = homePositionFor(plan.actorId as 'rin' | 'chikage' | 'oboro' | 'mo');
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
            if (plan.targetId) this.playImpactFx(plan.targetId, false);
            if (plan.motion !== 'REACTION') this.playTargetReaction(plan.targetId);
            this.runtime?.resolveConfirmedPlayerAction();
            this.queuePresentationDelay(120, () => {
              this.focusedActorId = undefined;
              this.resetWorldCamera(210);
              this.tweens.add({
                targets: actor,
                x: home.x,
                y: home.y,
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
    this.focusedActorId = undefined;
    this.resetWorldCamera(ACTIVE_FOCUS_DURATION_MS);
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
        if (plan.targetId) this.playImpactFx(plan.targetId, true);
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

    if (plan.motion === 'REACTION' && actor && (!target || plan.targetId === plan.actorId)) {
      return { x: actor.x, y: actor.y };
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
    const target = targetId ? this.actorSprites.get(targetId) : undefined;
    const x = target?.x ?? REFACTOR_BATTLE_LAYOUT.actionPosition.x + 70;
    const y = target?.y ?? REFACTOR_BATTLE_LAYOUT.actionPosition.y;
    const fx = this.add.graphics();
    fx.lineStyle(8, 0xf4e6b5, 0.9).beginPath().arc(x, y, 54, -0.9, 0.55).strokePath();
    this.addToWorld(fx);
    this.sound.play(REFACTOR_SWISH_SFX_KEY, { volume: 0.28 });
    this.tweens.add({
      targets: fx,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => fx.destroy(),
    });
  }

  private playImpactFx(targetId: string, enemyImpact: boolean): void {
    const target = this.actorSprites.get(targetId);
    if (!target) return;
    const color = enemyImpact ? 0xff7b62 : 0xf0d27d;
    const ring = this.add.circle(target.x, target.y, 26, color, 0.2)
      .setStrokeStyle(4, color, 0.95)
      .setScale(0.62);
    this.addToWorld(ring);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.7,
      scaleY: 1.7,
      duration: 170,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    this.playImpactSfx(enemyImpact);
  }

  private ensureBattleMusic(): void {
    if (!this.cache.audio.exists(this.selectedMusicKey)) return;
    if (!this.battleMusic) {
      this.battleMusic = this.sound.add(this.selectedMusicKey, { loop: true, volume: 0.3 });
    }
    if (!this.battleMusic.isPlaying) {
      try {
        this.battleMusic.play();
      } catch {
        // Browser autoplay may remain locked until the first pointer interaction.
      }
    }
  }

  private playImpactSfx(enemyImpact: boolean): void {
    this.sound.play(REFACTOR_IMPACT_SFX_KEY, { volume: enemyImpact ? 0.34 : 0.28 });
  }

  private beginPresentationMotion(): void {
    this.clearAutoAdvance();
    this.animationBusy = true;
    this.input.enabled = false;
    this.hudContent?.setVisible(false);
  }

  private finishPresentationMotion(): void {
    for (const timer of this.presentationTimers.splice(0)) timer.remove(false);
    this.animationBusy = false;
    this.input.enabled = true;
    this.hudContent?.setVisible(true);
  }

  private clearPresentationMotion(): void {
    this.clearAutoAdvance();
    for (const timer of this.presentationTimers.splice(0)) timer.remove(false);
    this.tweens.killAll();
    this.focusedActorId = undefined;
    // Scene shutdown disposes cameras before every shutdown listener has finished.
    // Teardown must not mutate the world camera or route transitions can abort.
    this.animationBusy = false;
    if (this.input) this.input.enabled = true;
  }

  private cleanupScenePresentation(): void {
    this.clearPresentationMotion();
    this.battleMusic?.stop();
    this.battleMusic?.destroy();
    this.battleMusic = undefined;
  }

  private queuePresentationDelay(delay: number, callback: () => void): void {
    const timer = this.time.delayedCall(delay, callback);
    this.presentationTimers.push(timer);
  }

  private drawBattlefieldBackground(): void {
    const backgroundKey = REFACTOR_BATTLE_BACKGROUND_KEYS[
      this.battlefield === 'mountain-cut'
        ? 'mountain-cut'
        : this.battlefield === 'forest-path'
          ? 'forest-path'
          : this.battlefield === 'terminal-platform'
            ? 'terminal-platform'
            : 'rail-halt'
    ];
    if (!this.textures.exists(backgroundKey)) return;
    const background = this.add.image(640, 360, backgroundKey);
    const frame = backgroundFrame(background.width, background.height);
    background.setPosition(frame.x, frame.y).setDisplaySize(frame.displayWidth, frame.displayHeight);
    this.addToWorld(background);
  }

  private showBattleResult(outcome: 'victory' | 'defeat'): void {
    if (this.resultShown) return;
    this.resultShown = true;
    this.clearAutoAdvance();
    const victory = outcome === 'victory';
    const decision = battleExitDecision(outcome, this.journeyNodeId);
    this.addToHud(this.add.rectangle(640, 360, 1280, 720, 0x03070b, 0.72));
    this.addText(640, 320, victory ? '戰鬥勝利' : '戰鬥敗北', '34px', victory ? '#f1d58b' : '#e28d87', 0.5);
    this.drawButton(640, 390, 220, 44, decision.label, () => {
      if (decision.destination === 'journey') {
        if (decision.markArea01Cleared) this.registry.set('journey-area01-cleared', true);
        this.scene.start('JourneyScene');
      } else {
        this.scene.restart({ journeyNodeId: this.journeyNodeId });
      }
    });
  }

  private publishQaState(view: RefactorBattleView): void {
    const host = document.getElementById('game');
    if (!host) return;
    const encounter = storyEncounter(this.journeyNodeId);
    host.dataset.qaScene = 'refactor-battle';
    host.dataset.qaBattle = this.journeyNodeId;
    host.dataset.qaPhase = view.phase;
    host.dataset.qaOutcome = this.qaOutcome ?? view.outcome ?? '';
    host.dataset.qaPlayers = String(view.timeline.filter((node) => node.team === 'player').length);
    host.dataset.qaEnemies = String(view.timeline.filter((node) => node.team === 'enemy').length);
    host.dataset.qaExpectedEnemies = String(encounter?.enemies.length ?? 0);
    host.dataset.qaBattlefield = this.battlefield;
    host.dataset.qaMusic = this.selectedMusicKey;
  }

  private addFittedImage(
    x: number,
    y: number,
    textureKey: string,
    maxWidth: number,
    maxHeight: number,
    alpha = 1,
    layer: RenderLayer = 'hud',
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, textureKey).setAlpha(alpha);
    const sourceWidth = Math.max(1, image.width);
    const sourceHeight = Math.max(1, image.height);
    image.setScale(Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight));
    this.addToLayer(image, layer);
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
    this.addToHud(
      this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, fill, alpha)
        .setStrokeStyle(1, stroke, 0.3),
    );
  }

  private drawButton(x: number, y: number, width: number, height: number, label: string, action: () => void): void {
    const button = this.add.rectangle(x, y, width, height, 0x2b251b, 0.96)
      .setStrokeStyle(1, 0xc4a361, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', action);
    this.addToHud(button);
    this.addText(x, y, label, '11px', '#f0d69d', 0.5);
  }

  private addText(
    x: number,
    y: number,
    text: string,
    fontSize: string,
    color: string,
    origin = 0,
    layer: RenderLayer = 'hud',
  ): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize,
      color,
      lineSpacing: 4,
      align: origin === 0.5 ? 'center' : 'left',
    }).setOrigin(origin);
    this.addToLayer(label, layer);
    return label;
  }

  private addToLayer<T extends Phaser.GameObjects.GameObject>(object: T, layer: RenderLayer): T {
    return layer === 'world' ? this.addToWorld(object) : this.addToHud(object);
  }

  private addToWorld<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.worldContent?.add(object);
    return object;
  }

  private addToHud<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.hudContent?.add(object);
    return object;
  }
}
