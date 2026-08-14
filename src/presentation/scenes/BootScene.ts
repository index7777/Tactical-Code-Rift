import Phaser from 'phaser';
import { MAX_AP, actionApCost, recoverAp, sequenceApCost } from '../../core/combat/ActionPoints';
import { resolveCardPair } from '../../core/combat/RelayClash';
import type { CombatIntent } from '../../core/combat/TargetClash';

const NAMES = ['A', 'B', 'C'] as const;
const PLAYER_HOME = [{ x: 960, y: 235 }, { x: 1040, y: 340 }, { x: 1120, y: 445 }];
const ENEMY_HOME = [{ x: 320, y: 235 }, { x: 245, y: 340 }, { x: 170, y: 445 }];

interface QueuedAction extends CombatIntent { slot: number; apCost: number }
interface ActorView { root: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Sprite; hpBar: Phaser.GameObjects.Rectangle }

export class BootScene extends Phaser.Scene {
  private players = new Map<string, ActorView>();
  private enemies = new Map<string, ActorView>();
  private formation = new Map<string, { x: number; y: number }>();
  private queue: QueuedAction[] = [];
  private selectedActor = 'P-A';
  private selectedTarget = 'E-A';
  private ap = MAX_AP;
  private turn = 1;
  private running = false;
  private apText!: Phaser.GameObjects.Text;
  private apFill!: Phaser.GameObjects.Rectangle;
  private status!: Phaser.GameObjects.Text;
  private slotCards: Phaser.GameObjects.Text[] = [];
  private actorButtons: Phaser.GameObjects.Text[] = [];
  private targetButtons: Phaser.GameObjects.Text[] = [];

  preload(): void {
    this.load.image('bg-sky', 'assets/battle/bg-sky.png');
    this.load.image('bg-mountains-1', 'assets/battle/bg-mountains-1.png');
    this.load.image('bg-mountains-2', 'assets/battle/bg-mountains-2.png');
    this.load.image('bg-trees', 'assets/battle/bg-trees.png');
    this.load.spritesheet('hero-knight', 'assets/battle/hero-knight.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('enemy-idle', 'assets/battle/enemy-idle.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('enemy-attack', 'assets/battle/enemy-attack.png', { frameWidth: 13, frameHeight: 16 });
    this.load.spritesheet('slash-fx', 'assets/battle/slash-fx.png', { frameWidth: 64, frameHeight: 47 });
    this.load.audio('sword-swish', 'assets/battle/sword-swish.wav');
    this.load.audio('sword-impact', 'assets/battle/sword-impact.wav');
  }

  create(): void {
    this.cameras.main.setBounds(-1400, 0, 4080, 720);
    this.createAnimations();
    this.createBattlefield();
    this.createActors();
    this.createHud();
    this.renderHud('選擇角色與目標，再加入行動槽');
  }

  private createAnimations(): void {
    this.anims.create({ key: 'hero-idle', frames: this.anims.generateFrameNumbers('hero-knight', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'hero-run', frames: this.anims.generateFrameNumbers('hero-knight', { start: 4, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'hero-attack', frames: this.anims.generateFrameNumbers('hero-knight', { start: 8, end: 11 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'enemy-idle-anim', frames: this.anims.generateFrameNumbers('enemy-idle', { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'enemy-attack-anim', frames: this.anims.generateFrameNumbers('enemy-attack', { start: 0, end: 5 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'slash', frames: this.anims.generateFrameNumbers('slash-fx', { start: 0, end: 8 }), frameRate: 24, repeat: 0, hideOnComplete: true });
  }

  private createBattlefield(): void {
    this.add.tileSprite(640, 180, 4080, 520, 'bg-sky').setTileScale(1.45).setDepth(-10);
    this.add.tileSprite(640, 210, 4080, 520, 'bg-mountains-1').setTileScale(1.45).setDepth(-9).setAlpha(.9);
    this.add.tileSprite(640, 240, 4080, 520, 'bg-mountains-2').setTileScale(1.45).setDepth(-8).setAlpha(.95);
    this.add.tileSprite(640, 270, 4080, 520, 'bg-trees').setTileScale(1.45).setDepth(-7);
    const ground = this.add.graphics().setDepth(-6);
    ground.fillGradientStyle(0x17211d, 0x17211d, 0x090d0c, 0x090d0c, 1).fillRect(-1400, 405, 4080, 185);
    ground.lineStyle(2, 0x66705a, .34).lineBetween(-1400, 455, 2680, 455);
    for (let x = -1400; x < 2680; x += 120) ground.lineStyle(1, 0xb1a27a, .13).lineBetween(x, 405, x + 90, 560);
    this.add.rectangle(640, 485, 1280, 150, 0x050807, .18).setDepth(-5);
  }

  private createActors(): void {
    NAMES.forEach((name, index) => {
      const p = this.createActor(`P-${name}`, `守刃 ${name}`, PLAYER_HOME[index]!, true, 0x73c8d6);
      const e = this.createActor(`E-${name}`, `鐵衛 ${name}`, ENEMY_HOME[index]!, false, 0xd66c63);
      this.players.set(`P-${name}`, p);
      this.enemies.set(`E-${name}`, e);
      this.formation.set(`P-${name}`, { ...PLAYER_HOME[index]! });
      this.formation.set(`E-${name}`, { ...ENEMY_HOME[index]! });
    });
  }

  private createActor(id: string, label: string, position: { x: number; y: number }, player: boolean, color: number): ActorView {
    const shadow = this.add.ellipse(0, 58, player ? 112 : 96, 24, 0x000000, .48);
    const sprite = this.add.sprite(0, 0, player ? 'hero-knight' : 'enemy-idle').setScale(player ? 2.15 : 6).setFlipX(player);
    if (player) sprite.play('hero-idle'); else sprite.play('enemy-idle-anim');
    if (player) sprite.setTint([0xffffff, 0xb9e9ff, 0xffd7b8][NAMES.indexOf(id.slice(-1) as typeof NAMES[number])]!);
    const plate = this.add.rectangle(0, 80, 118, 27, 0x07100f, .88).setStrokeStyle(1, color, .9);
    const text = this.add.text(0, 80, label, { fontFamily: 'sans-serif', fontSize: '14px', color: '#f4efe3' }).setOrigin(.5);
    this.add.rectangle(0, 101, 112, 8, 0x23191a, .92);
    const hpBar = this.add.rectangle(-56, 101, 112, 8, color, 1).setOrigin(0, .5);
    const root = this.add.container(position.x, position.y, [shadow, sprite, plate, text, hpBar]).setDepth(10 + position.y);
    return { root, sprite, hpBar };
  }

  private createHud(): void {
    this.add.rectangle(0, 0, 1280, 92, 0x050807, .88).setOrigin(0).setScrollFactor(0).setDepth(100);
    this.add.text(24, 16, 'RIFT ASSAULT', { fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#f1e8cf', letterSpacing: 2 }).setScrollFactor(0).setDepth(101);
    this.add.text(25, 49, '三槽交鋒展示', { fontFamily: 'sans-serif', fontSize: '13px', color: '#91a59e', letterSpacing: 3 }).setScrollFactor(0).setDepth(101);
    this.apText = this.add.text(875, 17, '', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#d9fff0' }).setScrollFactor(0).setDepth(101);
    this.add.rectangle(875, 52, 330, 14, 0x15211e, 1).setOrigin(0, .5).setStrokeStyle(1, 0x769c8e).setScrollFactor(0).setDepth(101);
    this.apFill = this.add.rectangle(878, 52, 324, 8, 0x59dba9, 1).setOrigin(0, .5).setScrollFactor(0).setDepth(102);

    this.status = this.add.text(640, 492, '', { fixedWidth: 830, padding: { x: 14, y: 9 }, align: 'center', fontFamily: 'sans-serif', fontSize: '17px', color: '#f4ead1', backgroundColor: '#070b0ae8' }).setOrigin(.5).setScrollFactor(0).setDepth(101);
    this.add.rectangle(0, 525, 1280, 195, 0x060908, .98).setOrigin(0).setStrokeStyle(2, 0x897957, .8).setScrollFactor(0).setDepth(100);
    this.add.text(20, 541, '出擊者', { fontSize: '13px', color: '#9aab9f' }).setScrollFactor(0).setDepth(101);
    this.add.text(20, 615, '攻擊目標', { fontSize: '13px', color: '#9aab9f' }).setScrollFactor(0).setDepth(101);

    NAMES.forEach((name, index) => {
      this.actorButtons.push(this.hudButton(95 + index * 105, 560, 94, `守刃 ${name}`, () => { if (!this.running) { this.selectedActor = `P-${name}`; this.renderHud(); } }));
      this.targetButtons.push(this.hudButton(95 + index * 105, 634, 94, `鐵衛 ${name}`, () => { if (!this.running) { this.selectedTarget = `E-${name}`; this.renderHud(); } }, 0x3b2020));
    });
    this.hudButton(95, 682, 200, '加入行動槽', () => this.addAction(), 0x2e765e);
    this.hudButton(305, 682, 92, '清除', () => { if (!this.running) { this.queue = []; this.renderHud('行動槽已清除'); } }, 0x463d32);

    for (let index = 0; index < 3; index++) {
      const card = this.add.text(430 + index * 190, 565, '', { fixedWidth: 174, fixedHeight: 112, padding: { x: 12, y: 12 }, fontFamily: 'sans-serif', fontSize: '15px', color: '#ebeadf', backgroundColor: '#151c19', stroke: '#000000', strokeThickness: 1 }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => { if (!this.running && this.queue[index]) { this.queue.splice(index, 1); this.renderHud(`已移除槽 ${index + 1}`); } });
      this.slotCards.push(card);
    }
    this.hudButton(1030, 565, 220, '執行攻擊序列', () => void this.executeQueue(), 0x9a4937);
    this.hudButton(1030, 625, 220, '快速配置 A 三連', () => this.quickTriple(), 0x394c61);
  }

  private hudButton(x: number, y: number, width: number, label: string, action: () => void, color = 0x24312d): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, { fixedWidth: width, padding: { y: 9 }, align: 'center', fontFamily: 'sans-serif', fontSize: '14px', color: '#f3efe4', backgroundColor: `#${color.toString(16).padStart(6, '0')}` }).setOrigin(.5, 0).setScrollFactor(0).setDepth(102).setInteractive({ useHandCursor: true });
    button.on('pointerdown', action);
    return button;
  }

  private addAction(): void {
    if (this.running || this.queue.length >= 3) return;
    const previous = this.queue.filter(action => action.actorId === this.selectedActor).length;
    const apCost = actionApCost(previous);
    const projected = this.spentAp() + apCost;
    if (projected > this.ap) { this.renderHud(`AP 不足：這次追加需要 ${apCost} AP`); return; }
    this.queue.push({ actorId: this.selectedActor, team: 'player', targetId: this.selectedTarget, type: 'ATK', power: 3 + this.queue.length, slot: this.queue.length, apCost });
    this.renderHud(previous ? `${this.selectedActor} 追加行動：消耗 ${apCost} AP` : `${this.selectedActor} 已加入行動槽`);
  }

  private quickTriple(): void {
    if (this.running) return;
    if (this.ap < 5) { this.renderHud('A 三連需要 5 AP，請保留 AP 到下一回合'); return; }
    this.queue = [
      { actorId: 'P-A', team: 'player', targetId: 'E-A', type: 'ATK', power: 3, slot: 0, apCost: 1 },
      { actorId: 'P-A', team: 'player', targetId: 'E-A', type: 'ATK', power: 4, slot: 1, apCost: 2 },
      { actorId: 'P-A', team: 'player', targetId: 'E-A', type: 'ATK', power: 5, slot: 2, apCost: 2 },
    ];
    this.selectedActor = 'P-A'; this.selectedTarget = 'E-A';
    this.renderHud('A 三連已配置：第三擊為擊退終結');
  }

  private spentAp(): number { return this.queue.reduce((sum, action) => sum + action.apCost, 0); }

  private renderHud(message?: string): void {
    const spent = this.spentAp();
    this.apText.setText(`TURN ${this.turn}　AP ${this.ap} / ${MAX_AP}　已配置 ${spent}`);
    this.apFill.width = 324 * Math.max(0, (this.ap - spent) / MAX_AP);
    this.actorButtons.forEach((button, index) => button.setStyle({ backgroundColor: this.selectedActor === `P-${NAMES[index]}` ? '#3d8a70' : '#24312d' }));
    this.targetButtons.forEach((button, index) => button.setStyle({ backgroundColor: this.selectedTarget === `E-${NAMES[index]}` ? '#8c443d' : '#3b2020' }));
    this.slotCards.forEach((card, index) => {
      const action = this.queue[index];
      card.setStyle({ backgroundColor: action ? '#20352e' : '#151c19' });
      card.setText(action ? `SLOT ${index + 1}\n守刃 ${action.actorId.slice(-1)} → 鐵衛 ${action.targetId?.slice(-1)}\nATK ${action.power}　消耗 ${action.apCost} AP${index > 0 && action.actorId === this.queue[index - 1]?.actorId ? '\n連擊' : ''}` : `SLOT ${index + 1}\n等待配置`);
    });
    if (message) this.status.setText(message);
  }

  private async executeQueue(): Promise<void> {
    if (this.running || !this.queue.length) { if (!this.queue.length) this.renderHud('至少配置一個行動槽'); return; }
    const cost = sequenceApCost(this.queue.map(action => action.actorId));
    if (cost > this.ap) { this.renderHud(`AP 不足：需要 ${cost}，目前 ${this.ap}`); return; }
    this.running = true;
    this.ap -= cost;
    this.renderHud(`攻擊序列啟動：消耗 ${cost} AP`);
    const totals = new Map<string, number>();
    const hits = new Map<string, number>();
    this.queue.forEach(action => totals.set(action.actorId, (totals.get(action.actorId) ?? 0) + 1));
    for (let index = 0; index < this.queue.length; index++) {
      const action = this.queue[index]!;
      const hit = (hits.get(action.actorId) ?? 0) + 1;
      hits.set(action.actorId, hit);
      const total = totals.get(action.actorId) ?? 1;
      const enemy: CombatIntent = index === 0
        ? { actorId: action.targetId!, team: 'enemy', targetId: action.actorId, type: 'ATK', power: 3 }
        : { actorId: `E-${NAMES[Math.min(index, 2)]}`, team: 'enemy', type: 'DEF', power: 3 };
      await this.playAction(action, enemy, hit, total);
      await this.delay(150);
    }
    const remaining = this.ap;
    this.ap = recoverAp(this.ap);
    this.turn += 1;
    this.queue = [];
    this.running = false;
    this.focusFormation(260);
    this.renderHud(`序列完成：保留 ${remaining} AP，下一回合恢復至 ${this.ap}`);
  }

  private async playAction(action: QueuedAction, enemyIntent: CombatIntent, hit: number, total: number): Promise<void> {
    const player = this.players.get(action.actorId)!;
    const target = this.enemies.get(action.targetId!)!;
    const playerHome = { ...this.formation.get(action.actorId)! };
    const targetHome = { ...this.formation.get(action.targetId!)! };
    const mutual = enemyIntent.type === 'ATK' && enemyIntent.actorId === action.targetId && enemyIntent.targetId === action.actorId;
    const midpoint = (playerHome.x + targetHome.x) / 2;
    const laneY = (playerHome.y + targetHome.y) / 2;
    const comboFinisher = total > 1 && hit === total;
    this.status.setText(mutual ? `SLOT ${action.slot + 1}　正面交鋒` : `SLOT ${action.slot + 1}　${hit} / ${total} 追擊`);
    this.cameras.main.pan(midpoint, 330, 260, 'Sine.easeInOut');
    player.sprite.play('hero-run');
    if (mutual) {
      const enemy = target;
      enemy.sprite.setTexture('enemy-attack', 0).play('enemy-attack-anim');
      this.sound.play('sword-swish', { volume: .42, rate: .96 });
      await Promise.all([
        this.move(player.root, midpoint + 58, laneY, 320),
        this.move(enemy.root, midpoint - 58, laneY, 320),
      ]);
      await this.strikeFx(midpoint, laneY - 10, action.actorId, comboFinisher);
      const result = resolveCardPair(action, enemyIntent);
      if (comboFinisher && result.enemyDamage > 0) {
        targetHome.x -= total === 3 ? 170 : 120;
        this.formation.set(action.targetId!, targetHome);
      }
      await Promise.all([this.returnActor(player, playerHome), this.returnActor(enemy, targetHome)]);
    } else {
      this.sound.play('sword-swish', { volume: .42, rate: 1 + hit * .04 });
      await this.move(player.root, targetHome.x + 92, targetHome.y, 330);
      await this.strikeFx(targetHome.x + 22, targetHome.y - 12, action.actorId, comboFinisher);
      if (comboFinisher) {
        targetHome.x -= total === 3 ? 170 : 120;
        this.formation.set(action.targetId!, targetHome);
        await this.move(target.root, targetHome.x, targetHome.y, 210);
      }
      await this.returnActor(player, playerHome);
    }
  }

  private async strikeFx(x: number, y: number, actorId: string, finisher: boolean): Promise<void> {
    const actor = this.players.get(actorId)!;
    actor.sprite.play('hero-attack');
    const fx = this.add.sprite(x, y, 'slash-fx').setScale(finisher ? 2.8 : 2.25).setDepth(80).play('slash');
    if (finisher) fx.setTint(0xffd486);
    this.sound.play('sword-impact', { volume: finisher ? .72 : .5, rate: finisher ? .84 : 1.04 });
    this.cameras.main.shake(finisher ? 170 : 95, finisher ? .011 : .005);
    await this.delay(finisher ? 260 : 190);
    fx.destroy();
  }

  private async returnActor(actor: ActorView, home: { x: number; y: number }): Promise<void> {
    actor.sprite.setTexture(actor === [...this.players.values()].find(view => view === actor) ? 'hero-knight' : 'enemy-idle', 0);
    if ([...this.players.values()].includes(actor)) actor.sprite.play('hero-run'); else actor.sprite.play('enemy-idle-anim');
    await this.move(actor.root, home.x, home.y, 270);
    if ([...this.players.values()].includes(actor)) actor.sprite.play('hero-idle'); else actor.sprite.play('enemy-idle-anim');
  }

  private move(target: Phaser.GameObjects.Container, x: number, y: number, duration: number): Promise<void> {
    return new Promise(resolve => this.tweens.add({ targets: target, x, y, duration, ease: 'Quad.easeInOut', onComplete: () => resolve() }));
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => this.time.delayedCall(ms, resolve)); }

  private focusFormation(duration: number): void {
    const points = [...this.formation.values()];
    const center = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    this.cameras.main.pan(center, 340, duration, 'Sine.easeInOut');
  }
}
