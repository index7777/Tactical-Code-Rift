import Phaser from 'phaser';
import {
  availableStoryNodes,
  createJourneyState,
  moveJourney,
  type JourneyState,
  type StoryNodeType,
  type StoryRouteNode,
} from '../../core/route/RouteGenerator';
import { storyEncounter } from '../../core/route/EncounterCatalog';
import {
  JOURNEY_MUSIC_FADE_IN_MS,
  JOURNEY_MUSIC_FADE_OUT_MS,
  journeyLoopFadeDelayMs,
} from '../../core/audio/JourneyMusicPolicy';
import { availableDemoCardUpgrades } from '../../core/cards/DemoCardUpgradeProgression';
import {
  chooseDemoUpgradeReward,
  createDemoCardUpgradeRunState,
  normalizeDemoCardUpgradeRunState,
  offerDemoUpgradeRewardAfterVictory,
  type DemoCardUpgradeRunState,
} from '../../core/cards/DemoCardUpgradeRunState';
import { prepareDemoCardUpgradeEncounterHandoff } from '../../application/battle/DemoCardUpgradeEncounterHandoff';
import { demoUpgradeRewardOptionViews } from '../journey/DemoUpgradeRewardPresentation';

const labels: Record<StoryNodeType, string> = {
  departure: '出發',
  battle: '迎擊',
  event: '事件',
  exploration: '探索',
  companion: '伙伴',
  elite: '精英',
  boss: '王',
};
const routeAssetRoot = 'assets/journey/route-map-ui-v1';
const splitAssetRoot = 'assets/journey/route-map-runtime-v1';
const routeBackground = 'assets/journey/world01/area01-route-bg-runtime-trial-v2.png';
const progressionRegistryKey = 'demo-card-upgrade-run-state';
const nodeIcons: Record<StoryNodeType, string> = {
  departure: 'start',
  battle: 'battle',
  event: 'event',
  exploration: 'rest',
  companion: 'reward',
  elite: 'elite',
  boss: 'boss',
};
const enemyNames: Record<string, string> = {
  'wet-corpse': '濡骸',
  'lantern-child': '提燈童',
  'mountain-hound': '山犬',
  'wayfarer-umbrella': '辻傘',
  'noose-ghost': '縊鬼',
  'lost-monk': '迷途僧',
  'rain-warrior': '雨夜武者',
  'rain-boss': '站守',
};
const routeCopy: Record<StoryNodeType, string> = {
  departure: '列車自人界駛入雨暮山線。',
  battle: '前方殺生線正在收束。',
  event: '沿線傳來異常動靜，旅途可能因此改變。',
  exploration: '離車探索雨暮山道，尋找線索與補給。',
  companion: '有人正在前方等待黃泉列車。',
  elite: '前方有強烈殺意盤踞。',
  boss: '終點站的氣息正從雨幕深處逼近。',
};

export class JourneyScene extends Phaser.Scene {
  private journeyMusic?: Phaser.Sound.BaseSound;
  private loopTimer?: Phaser.Time.TimerEvent;
  private leavingMap = false;
  private previewTitle?: Phaser.GameObjects.Text;
  private previewBody?: Phaser.GameObjects.Text;
  private previewAccent?: Phaser.GameObjects.Rectangle;
  private loadingLayer?: Phaser.GameObjects.Container;
  private compact = false;

  constructor() {
    super('JourneyScene');
  }

  preload(): void {
    const background = this.add.rectangle(640, 360, 1280, 720, 0x050914, 1);
    const glow = this.add.ellipse(640, 348, 420, 94, 0x487b85, 0.08);
    const title = this.add.text(640, 312, '第一區・雨暮山線', {
      fontFamily: 'serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f0dfc2',
    }).setOrigin(0.5);
    const status = this.add.text(640, 356, '正在展開因果路線', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#91b8c0',
    }).setOrigin(0.5);
    const track = this.add.rectangle(640, 392, 360, 3, 0x283a43, 0.9);
    const bar = this.add.rectangle(460, 392, 0, 3, 0xcaa55f, 1).setOrigin(0, 0.5);
    this.loadingLayer = this.add.container(0, 0, [background, glow, title, status, track, bar]).setDepth(1000);
    this.load.on('progress', (value: number) => bar.setDisplaySize(360 * value, 3));

    this.load.audio('journey-world-01', 'assets/music/world-01/zone1-train-bgm.mp3');
    this.load.image('journey-bg-world01', routeBackground);
    for (const name of ['normal', 'current', 'cleared', 'locked', 'elite', 'boss']) {
      this.load.image(`route-node-frame-${name}`, `${splitAssetRoot}/node-frame/node-frame-${name}.png`);
    }
    for (const name of ['start', 'battle', 'elite', 'boss', 'event', 'rest', 'reward']) {
      this.load.image(`route-icon-${name}`, `${splitAssetRoot}/node-icon/icon-${name}.png`);
    }
    for (const name of ['current-halo', 'available-pulse', 'cleared-ring', 'elite-aura', 'boss-aura']) {
      this.load.image(`route-node-fx-${name}`, `${splitAssetRoot}/node-fx/fx-${name}.png`);
    }
    for (const name of ['texture', 'glow', 'dot-normal', 'dot-current', 'dot-danger', 'particles-light', 'particles-danger']) {
      this.load.image(`route-conn-${name}`, `${splitAssetRoot}/connection-primitives/conn-${name}.png`);
    }
    for (const name of ['section-panel-frame-medium', 'section-panel-frame-wide', 'header-divider-line', 'info-accent-bar', 'corner-accent']) {
      this.load.image(`route-frame-${name}`, `${routeAssetRoot}/frames/${name}.png`);
    }
  }

  create(): void {
    this.loadingLayer?.destroy(true);
    this.loadingLayer = undefined;
    this.compact = window.innerHeight <= 500;
    this.startJourneyMusic();

    const state = (this.registry.get('journey-state') as JourneyState | undefined) ?? createJourneyState();
    this.registry.set('journey-state', state);
    const progression = offerDemoUpgradeRewardAfterVictory(
      this.progressionState(),
      state.currentNodeId,
    );
    this.registry.set(progressionRegistryKey, progression);
    this.publishUpgradeQaState(progression);

    this.add.image(640, 360, 'journey-bg-world01').setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x03080f, 0.12);
    this.add.rectangle(640, 55, 1280, 110, 0x03080d, 0.82).setStrokeStyle(1, 0x8aa5ad, 0.15);
    this.add.rectangle(640, 655, 1280, 130, 0x02070b, 0.88).setStrokeStyle(1, 0x7c969f, 0.2);
    this.add.image(640, 107, 'route-frame-header-divider-line').setDisplaySize(1092, 12).setAlpha(0.72);
    this.add.image(22, 22, 'route-frame-corner-accent').setDisplaySize(44, 46).setOrigin(0).setAlpha(0.72);
    this.add.text(48, 28, '第一區・雨暮山線', {
      fontFamily: 'serif',
      fontSize: this.compact ? '34px' : '30px',
      fontStyle: 'bold',
      color: '#f3e2c4',
    });
    this.add.text(50, 68, '黃泉列車｜雨夜山道', {
      fontFamily: 'sans-serif',
      fontSize: this.compact ? '15px' : '13px',
      fontStyle: 'bold',
      color: '#9bc4cb',
    });
    this.add.text(1232, 32, '路線進行', {
      fontFamily: 'sans-serif',
      fontSize: this.compact ? '14px' : '12px',
      fontStyle: 'bold',
      color: '#d7e5e7',
    }).setOrigin(1, 0);
    this.add.text(1232, 57, `${Math.max(0, state.visitedIds.length - 1)} / ${state.route.nodes.length - 1}`, {
      fontFamily: 'monospace',
      fontSize: this.compact ? '21px' : '18px',
      fontStyle: 'bold',
      color: '#edcf78',
    }).setOrigin(1, 0);

    const available = new Set(availableStoryNodes(state).map((node) => node.id));
    const visited = new Set(state.visitedIds);
    const pos = (column: number, lane: number) => ({ x: 135 + column * 205, y: 220 + lane * 122 });

    for (const node of state.route.nodes) {
      for (const nextId of node.nextIds) {
        const next = state.route.nodes.find((candidate) => candidate.id === nextId)!;
        const a = pos(node.column, node.lane);
        const b = pos(next.column, next.lane);
        const travelled = visited.has(node.id) && visited.has(next.id);
        const open = available.has(next.id);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        const rotation = Math.atan2(dy, dx);
        const danger = next.type === 'elite' || next.type === 'boss';
        const tint = danger ? 0xd6525d : travelled ? 0xd7e4e7 : open ? 0xe8c571 : 0x527482;
        this.add.image((a.x + b.x) / 2, (a.y + b.y) / 2, 'route-conn-glow')
          .setDisplaySize(length + 12, open ? (this.compact ? 16 : 14) : 10)
          .setRotation(rotation)
          .setTint(tint)
          .setAlpha(open ? 0.62 : travelled ? 0.52 : 0.3);
        this.add.image((a.x + b.x) / 2, (a.y + b.y) / 2, 'route-conn-texture')
          .setDisplaySize(length + 8, this.compact ? 6 : 5)
          .setRotation(rotation)
          .setTint(tint)
          .setAlpha(travelled ? 0.94 : open ? 0.9 : 0.62);
        const dotKey = danger ? 'danger' : open ? 'current' : 'normal';
        const dotSize = open ? (this.compact ? 16 : 14) : 10;
        this.add.image((a.x + b.x) / 2, (a.y + b.y) / 2, `route-conn-dot-${dotKey}`)
          .setDisplaySize(dotSize, dotSize)
          .setAlpha(open ? 0.88 : 0.5);
        if (open) {
          this.add.image((a.x + b.x) / 2, (a.y + b.y) / 2, `route-conn-particles-${danger ? 'danger' : 'light'}`)
            .setDisplaySize(Math.min(92, length * 0.42), 32)
            .setRotation(rotation)
            .setAlpha(0.46);
        }
      }
    }

    this.buildPreviewPanel();
    const current = state.route.nodes.find((node) => node.id === state.currentNodeId)!;
    this.showNodePreview(current);
    for (const node of state.route.nodes) {
      const p = pos(node.column, node.lane);
      const active = available.has(node.id);
      const done = visited.has(node.id);
      const isCurrent = node.id === state.currentNodeId;
      const container = this.add.container(p.x, p.y);
      const frameKey = node.type === 'boss'
        ? 'boss'
        : node.type === 'elite'
          ? 'elite'
          : isCurrent
            ? 'current'
            : done
              ? 'cleared'
              : active
                ? 'normal'
                : 'locked';
      const stateFx = isCurrent ? 'current-halo' : active ? 'available-pulse' : done ? 'cleared-ring' : undefined;
      const auraFx = node.type === 'boss' ? 'boss-aura' : node.type === 'elite' ? 'elite-aura' : undefined;
      const activeSize = this.compact ? 70 : 64;
      const idleSize = this.compact ? 60 : 54;
      const aura = auraFx
        ? this.add.image(0, 0, `route-node-fx-${auraFx}`)
          .setDisplaySize(active || isCurrent ? 86 : 72, active || isCurrent ? 86 : 72)
          .setAlpha(active || isCurrent ? 0.66 : 0.34)
        : undefined;
      const halo = stateFx
        ? this.add.image(0, 0, `route-node-fx-${stateFx}`)
          .setDisplaySize(active || isCurrent ? 64 : 58, active || isCurrent ? 64 : 58)
          .setAlpha(active || isCurrent ? 0.42 : 0.34)
        : undefined;
      const diamond = this.add.image(0, 0, `route-node-frame-${frameKey}`)
        .setDisplaySize(active || isCurrent ? activeSize : idleSize, active || isCurrent ? activeSize : idleSize);
      const glyph = this.add.text(0, 0, node.type === 'boss' ? '終' : node.type === 'elite' ? '武' : node.type === 'departure' ? '始' : '斬', {
        fontFamily: 'serif',
        fontSize: active ? '12px' : '10px',
        fontStyle: 'bold',
        color: active ? '#fff0cf' : done ? '#c6e6e9' : '#82949b',
      }).setOrigin(0.5).setVisible(false);
      const caption = this.add.text(0, this.compact ? 38 : 34, labels[node.type], {
        fontFamily: 'sans-serif',
        fontSize: this.compact ? '15px' : '12px',
        fontStyle: 'bold',
        color: active ? '#fff0d3' : done ? '#cce2e4' : '#879ca4',
      }).setOrigin(0.5);
      const iconSize = active ? (this.compact ? 34 : 31) : (this.compact ? 28 : 25);
      const icon = this.add.image(0, 0, `route-icon-${nodeIcons[node.type]}`)
        .setDisplaySize(iconSize, iconSize)
        .setAlpha(active ? 1 : done ? 0.92 : 0.58);
      container.add([...(aura ? [aura] : []), ...(halo ? [halo] : []), diamond, icon, glyph, caption]);

      if (active) {
        if (halo) {
          this.tweens.add({
            targets: halo,
            scale: 1.08,
            alpha: 0.18,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
        const hit = this.add.circle(0, 0, 34, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        container.add(hit);
        hit.on('pointerover', () => {
          container.setScale(1.08);
          this.showNodePreview(node);
        }).on('pointerout', () => container.setScale(1))
          .on('pointerdown', () => this.selectNode(state, node.id, p.x, p.y));
      } else {
        container.setAlpha(done ? 1 : 0.72);
        container.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains)
          .on('pointerover', () => this.showNodePreview(node));
      }
    }

    const cp = pos(current.column, current.lane);
    this.createTrainToken(cp.x, cp.y + 58).setData('train', true).setDepth(20);
    this.add.text(48, 624, '黃泉列車', {
      fontFamily: 'serif',
      fontSize: this.compact ? '18px' : '15px',
      fontStyle: 'bold',
      color: '#ead9bb',
    });
    this.add.text(48, 650, available.size ? '選擇下一段軌道；滑過節點可查看敵群。' : '本區路線已抵達終點。', {
      fontFamily: 'sans-serif',
      fontSize: this.compact ? '14px' : '12px',
      color: '#a9c1c7',
    });

    if (state.currentNodeId === 'boss-1' && this.registry.get('journey-area01-cleared')) {
      this.showAreaClear();
    } else if (progression.pendingMilestone) {
      this.showUpgradeReward(progression);
    }
  }

  private progressionState(): DemoCardUpgradeRunState {
    const stored = this.registry.get(progressionRegistryKey) as DemoCardUpgradeRunState | undefined;
    const state = stored
      ? normalizeDemoCardUpgradeRunState(stored)
      : createDemoCardUpgradeRunState();
    this.registry.set(progressionRegistryKey, state);
    return state;
  }

  private showUpgradeReward(state: DemoCardUpgradeRunState): void {
    if (!state.pendingMilestone) return;
    const options = demoUpgradeRewardOptionViews(availableDemoCardUpgrades(state.ownedUpgradeIds));
    if (!options.length) return;

    this.add.rectangle(640, 360, 1280, 720, 0x02060a, 0.82)
      .setDepth(300)
      .setInteractive();
    this.add.rectangle(640, 354, 1120, 292, 0x0c171d, 0.98)
      .setStrokeStyle(2, 0xc6a45f, 0.9)
      .setDepth(301);
    this.add.text(640, 248, '戰術強化', {
      fontFamily: 'serif',
      fontSize: this.compact ? '30px' : '28px',
      fontStyle: 'bold',
      color: '#f4dfb8',
    }).setOrigin(0.5).setDepth(302);
    this.add.text(640, 286, `選擇一項家系強化｜已取得 ${state.ownedUpgradeIds.length} / 3`, {
      fontFamily: 'sans-serif',
      fontSize: this.compact ? '15px' : '13px',
      color: '#a9c8ce',
    }).setOrigin(0.5).setDepth(302);

    const buttonWidth = 188;
    const gap = 18;
    const totalWidth = options.length * buttonWidth + (options.length - 1) * gap;
    const startX = 640 - totalWidth / 2 + buttonWidth / 2;
    options.forEach((option, index) => {
      const x = startX + index * (buttonWidth + gap);
      const button = this.add.rectangle(x, 382, buttonWidth, 112, 0x18262c, 0.98)
        .setStrokeStyle(1, 0x86adb4, 0.72)
        .setDepth(302)
        .setInteractive({ useHandCursor: true });
      const title = this.add.text(x, 360, option.familyLabel, {
        fontFamily: 'serif',
        fontSize: this.compact ? '20px' : '18px',
        fontStyle: 'bold',
        color: '#f3dfb6',
      }).setOrigin(0.5).setDepth(303);
      const effect = this.add.text(x, 402, option.effectLabel, {
        fontFamily: 'sans-serif',
        fontSize: this.compact ? '14px' : '12px',
        color: '#c6dadd',
        align: 'center',
      }).setOrigin(0.5).setDepth(303);
      button.on('pointerover', () => button.setFillStyle(0x26383e, 1))
        .on('pointerout', () => button.setFillStyle(0x18262c, 0.98))
        .on('pointerdown', () => {
          const next = chooseDemoUpgradeReward(this.progressionState(), option.id);
          this.registry.set(progressionRegistryKey, next);
          this.publishUpgradeQaState(next);
          this.scene.restart();
        });
      void title;
      void effect;
    });
  }

  private publishUpgradeQaState(state: DemoCardUpgradeRunState): void {
    const host = document.getElementById('game');
    if (!host) return;
    host.dataset.qaUpgradeIds = state.ownedUpgradeIds.join(',');
    host.dataset.qaUpgradePending = state.pendingMilestone ?? '';
  }

  private showAreaClear(): void {
    const veil = this.add.rectangle(640, 360, 1280, 720, 0x03070b, 0.78).setDepth(300);
    const panel = this.add.rectangle(640, 350, 520, 190, 0x101c23, 0.97).setStrokeStyle(2, 0xc8a45d, 0.9).setDepth(301);
    const kicker = this.add.text(640, 302, '第一區踏破', {
      fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#e4c877',
    }).setOrigin(0.5).setDepth(302);
    const title = this.add.text(640, 346, '雨暮山線・終', {
      fontFamily: 'serif', fontSize: '34px', fontStyle: 'bold', color: '#fff0d5',
    }).setOrigin(0.5).setDepth(302);
    const body = this.add.text(640, 394, '站守已散，黃泉列車完成本區行程。', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#bad3d7',
    }).setOrigin(0.5).setDepth(302);
    void veil;
    void panel;
    void kicker;
    void title;
    void body;
  }

  private createTrainToken(x: number, y: number): Phaser.GameObjects.Container {
    const token = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 8, 104, 16, 0x020507, 0.55);
    const body = this.add.rectangle(-12, 0, 72, 24, 0x14242b, 0.98).setStrokeStyle(2, 0xc29a55, 0.95);
    const engine = this.add.rectangle(36, 0, 34, 22, 0x1b3036, 0.98).setStrokeStyle(2, 0xc29a55, 0.95);
    const nose = this.add.triangle(61, 0, -12, -11, -12, 11, 13, 0, 0x16252b, 0.98).setStrokeStyle(2, 0xc29a55, 0.9);
    const lamp = this.add.circle(72, 0, 3, 0xe2b467, 1);
    token.add([shadow, body, engine, nose]);
    for (const offset of [-38, -22, -6, 10]) token.add(this.add.circle(offset, 0, 2.5, 0xe2b467, 0.9));
    token.add(lamp);
    return token;
  }

  private buildPreviewPanel(): void {
    const x = this.compact ? 830 : 850;
    const y = this.compact ? 574 : 594;
    const w = this.compact ? 405 : 385;
    const h = this.compact ? 122 : 102;
    this.add.image(x + w / 2, y + h / 2, 'route-frame-section-panel-frame-medium').setDisplaySize(w, h).setAlpha(0.96);
    this.previewAccent = this.add.rectangle(x + 4, y + h / 2, 4, h - 12, 0x77b9c4, 0.9);
    this.previewTitle = this.add.text(x + 18, y + 12, '', {
      fontFamily: 'serif', fontSize: this.compact ? '19px' : '16px', fontStyle: 'bold', color: '#f3e4c8',
    });
    this.previewBody = this.add.text(x + 18, y + (this.compact ? 46 : 40), '', {
      fontFamily: 'sans-serif',
      fontSize: this.compact ? '14px' : '12px',
      color: '#c7dadd',
      lineSpacing: 4,
      wordWrap: { width: w - 36 },
    });
  }

  private showNodePreview(node: StoryRouteNode): void {
    const encounter = storyEncounter(node.id);
    const accent = node.type === 'boss' ? 0xc64c5a : node.type === 'elite' ? 0xd09b54 : 0x77b9c4;
    this.previewAccent?.setFillStyle(accent, 0.95);
    this.previewTitle?.setText(encounter?.title ?? labels[node.type]);
    if (encounter) {
      const enemies = encounter.enemies.map((id) => enemyNames[id] ?? id).join('・');
      const battlefieldLabel = encounter.battlefield === 'rail-halt'
        ? '雨夜沿線月台'
        : encounter.battlefield === 'mountain-cut'
          ? '山壁切通'
          : encounter.battlefield === 'forest-path'
            ? '林間參道'
            : encounter.battlefield === 'terminal-platform'
              ? '終點月台'
              : encounter.battlefield === 'rooftop'
                ? '列車車頂'
                : encounter.battlefield === 'wayside'
                  ? '沿線停靠'
                  : '離車山道';
      this.previewBody?.setText(`敵群　${enemies}\n場景　${battlefieldLabel}`);
    } else {
      this.previewBody?.setText(routeCopy[node.type]);
    }
  }

  private selectNode(state: JourneyState, nodeId: string, x: number, y: number): void {
    const next = moveJourney(state, nodeId);
    this.registry.set('journey-state', next);
    const node = next.route.nodes.find((candidate) => candidate.id === nodeId)!;
    const train = this.children.list.find((object) => object.getData('train')) as Phaser.GameObjects.Container;
    this.input.enabled = false;
    this.tweens.add({
      targets: train,
      x,
      y: y + 54,
      duration: 720,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        const encounter = storyEncounter(node.id);
        if (encounter) {
          prepareDemoCardUpgradeEncounterHandoff(this.progressionState().ownedUpgradeIds);
          const veil = this.add.rectangle(640, 360, 1280, 720, node.type === 'boss' ? 0x26080d : 0x061016, 0).setDepth(200);
          const label = this.add.text(640, 348, encounter.title, {
            fontFamily: 'serif',
            fontSize: node.type === 'boss' ? '34px' : '26px',
            fontStyle: 'bold',
            color: '#fff1d6',
          }).setOrigin(0.5).setDepth(201).setAlpha(0);
          const sub = this.add.text(640, 390, encounter.enemies.map((id) => enemyNames[id] ?? id).join('・'), {
            fontFamily: 'sans-serif', fontSize: '12px', color: '#a9c9cf',
          }).setOrigin(0.5).setDepth(201).setAlpha(0);
          this.tweens.add({ targets: veil, alpha: 0.92, duration: 360 });
          this.tweens.add({ targets: [label, sub], alpha: 1, duration: 260 });
          this.time.delayedCall(420, () => this.leaveJourneyMusic(() => this.scene.start('RefactorBattleScene', { journeyNodeId: node.id })));
        } else {
          this.input.enabled = true;
          this.time.delayedCall(300, () => this.scene.restart());
        }
      },
    });
  }

  private startJourneyMusic(): void {
    this.leavingMap = false;
    this.journeyMusic = this.sound.get('journey-world-01') ?? this.sound.add('journey-world-01', { loop: false, volume: 0 });
    if (!this.journeyMusic.isPlaying) this.journeyMusic.play({ loop: false, volume: 0 });
    this.fadeJourneyMusic(0.34, JOURNEY_MUSIC_FADE_IN_MS);
    this.scheduleJourneyLoop();
    this.game.events.off(Phaser.Core.Events.BLUR, this.onGameBlur, this);
    this.game.events.off(Phaser.Core.Events.FOCUS, this.onGameFocus, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.onGameBlur, this);
    this.game.events.on(Phaser.Core.Events.FOCUS, this.onGameFocus, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.loopTimer?.remove(false);
      this.game.events.off(Phaser.Core.Events.BLUR, this.onGameBlur, this);
      this.game.events.off(Phaser.Core.Events.FOCUS, this.onGameFocus, this);
    });
  }

  private scheduleJourneyLoop(): void {
    this.loopTimer?.remove(false);
    if (!this.journeyMusic || this.leavingMap) return;
    const seek = (this.journeyMusic as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).seek;
    const delay = journeyLoopFadeDelayMs(this.journeyMusic.duration, seek);
    if (delay === null) {
      this.loopTimer = this.time.delayedCall(250, () => this.scheduleJourneyLoop());
      return;
    }
    this.loopTimer = this.time.delayedCall(delay, () => {
      if (!this.journeyMusic || this.leavingMap) return;
      this.fadeJourneyMusic(0, JOURNEY_MUSIC_FADE_OUT_MS);
      this.loopTimer = this.time.delayedCall(JOURNEY_MUSIC_FADE_OUT_MS, () => {
        if (!this.journeyMusic || this.leavingMap) return;
        this.journeyMusic.stop();
        this.journeyMusic.play({ loop: false, volume: 0 });
        this.fadeJourneyMusic(0.34, JOURNEY_MUSIC_FADE_IN_MS);
        this.scheduleJourneyLoop();
      });
    });
  }

  private fadeJourneyMusic(volume: number, duration: number): void {
    if (!this.journeyMusic) return;
    this.tweens.killTweensOf(this.journeyMusic);
    this.tweens.add({ targets: this.journeyMusic, volume, duration, ease: 'Sine.easeInOut' });
  }

  private leaveJourneyMusic(onComplete: () => void): void {
    this.leavingMap = true;
    this.loopTimer?.remove(false);
    this.fadeJourneyMusic(0, 650);
    this.time.delayedCall(650, () => {
      this.journeyMusic?.stop();
      onComplete();
    });
  }

  private onGameBlur(): void {
    this.fadeJourneyMusic(0, 450);
  }

  private onGameFocus(): void {
    if (!this.leavingMap) this.fadeJourneyMusic(0.34, 650);
  }
}
