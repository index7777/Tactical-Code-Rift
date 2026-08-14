export type BattleMode = 'active' | 'wait';
export type HeroId = 'yingli' | 'graycat' | 'forge' | 'birch';
export type BattlePhase = 'running' | 'command' | 'target' | 'victory' | 'defeat';

export interface UnitState { id: HeroId | 'enemy'; name: string; hp: number; maxHp: number; speed: number; atb: number; ready: boolean }
export interface ActionEvent { serial: number; attackerId: HeroId | 'enemy'; targetId: HeroId | 'enemy'; damage: number }
export interface BattleSnapshot {
  mode: BattleMode; phase: BattlePhase; heroes: UnitState[]; enemy: UnitState;
  readyOrder: HeroId[]; activeHeroId?: HeroId; elapsedMs: number; message: string; lastAction?: ActionEvent;
}

export const ATB_MAX = 1000;
export const ATB_RATE = 25;

export class AtbBattle {
  private snapshot: BattleSnapshot;
  private actionSerial = 0;

  constructor(mode: BattleMode = 'active') { this.snapshot = this.initialState(mode); }
  get state(): Readonly<BattleSnapshot> { return this.snapshot; }

  setMode(mode: BattleMode): void { this.snapshot.mode = mode; this.snapshot.message = mode === 'active' ? 'ACTIVE：选择时战斗继续' : 'WAIT：子选单暂停计时'; }
  restart(): void { this.snapshot = this.initialState(this.snapshot.mode); this.actionSerial = 0; }

  selectReadyHero(id: HeroId): boolean {
    if (!this.snapshot.readyOrder.includes(id)) return false;
    this.snapshot.activeHeroId = id; this.snapshot.phase = 'command';
    this.snapshot.message = `${this.hero(id).name}：选择指令`;
    return true;
  }

  cycleReady(direction: 1 | -1): boolean {
    const ready = this.snapshot.readyOrder; if (ready.length < 2) return false;
    const current = Math.max(0, ready.indexOf(this.snapshot.activeHeroId ?? ready[0]!));
    return this.selectReadyHero(ready[(current + direction + ready.length) % ready.length]!);
  }

  chooseAttack(): boolean {
    if (this.snapshot.phase !== 'command' || !this.snapshot.activeHeroId) return false;
    this.snapshot.phase = 'target'; this.snapshot.message = '选择攻击目标'; return true;
  }

  confirmTarget(): boolean {
    if (this.snapshot.phase !== 'target' || !this.snapshot.activeHeroId) return false;
    const actor = this.hero(this.snapshot.activeHeroId); const damage = 72;
    this.snapshot.enemy.hp = Math.max(0, this.snapshot.enemy.hp - damage);
    this.emitAction(actor.id as HeroId, 'enemy', damage);
    actor.atb = 0; actor.ready = false;
    this.snapshot.readyOrder = this.snapshot.readyOrder.filter(id => id !== actor.id);
    this.snapshot.activeHeroId = this.snapshot.readyOrder[0];
    this.snapshot.phase = this.snapshot.enemy.hp <= 0 ? 'victory' : this.snapshot.activeHeroId ? 'command' : 'running';
    this.snapshot.message = this.snapshot.enemy.hp <= 0 ? '胜利' : `${actor.name} 攻击造成 ${damage} 伤害`;
    return true;
  }

  cancelCommand(): boolean {
    if (this.snapshot.phase === 'target') { this.snapshot.phase = 'command'; this.snapshot.message = '返回指令选择'; return true; }
    return false;
  }

  tick(deltaMs: number): void {
    if (deltaMs <= 0 || this.snapshot.phase === 'victory' || this.snapshot.phase === 'defeat') return;
    const dt = Math.min(deltaMs, 100); this.snapshot.elapsedMs += dt;
    // FF6 Wait does not pause the top command list; only deeper ability/item submenus pause. This prototype has no submenu yet.
    for (const hero of this.snapshot.heroes) {
      if (hero.hp <= 0 || hero.ready) continue;
      hero.atb = Math.min(ATB_MAX, hero.atb + hero.speed * ATB_RATE * dt / 1000);
      if (hero.atb >= ATB_MAX) { hero.ready = true; this.snapshot.readyOrder.push(hero.id as HeroId); }
    }
    if (!this.snapshot.activeHeroId && this.snapshot.readyOrder.length > 0) {
      this.snapshot.activeHeroId = this.snapshot.readyOrder[0]; this.snapshot.phase = 'command';
      this.snapshot.message = `${this.hero(this.snapshot.activeHeroId!).name} Ready`;
    }
    this.advanceEnemy(dt);
  }

  private advanceEnemy(dt: number): void {
    const enemy = this.snapshot.enemy;
    enemy.atb = Math.min(ATB_MAX, enemy.atb + enemy.speed * ATB_RATE * dt / 1000);
    if (enemy.atb < ATB_MAX) return;
    enemy.atb = 0;
    const living = this.snapshot.heroes.filter(hero => hero.hp > 0);
    const target = living[0]; if (!target) return;
    const damage = 28; target.hp = Math.max(0, target.hp - damage);
    this.emitAction('enemy', target.id as HeroId, damage);
    this.snapshot.message = `${enemy.name} 攻击 ${target.name}，造成 ${damage} 伤害`;
    if (living.every(hero => hero.hp <= 0)) this.snapshot.phase = 'defeat';
  }

  private emitAction(attackerId: HeroId | 'enemy', targetId: HeroId | 'enemy', damage: number): void {
    this.snapshot.lastAction = { serial: ++this.actionSerial, attackerId, targetId, damage };
  }
  private hero(id: HeroId): UnitState { return this.snapshot.heroes.find(hero => hero.id === id)!; }

  private initialState(mode: BattleMode): BattleSnapshot {
    return {
      mode, phase: 'running', readyOrder: [], elapsedMs: 0, message: '脉冲时序启动',
      heroes: [
        { id: 'yingli', name: '螢礫', hp: 280, maxHp: 280, speed: 8, atb: 700, ready: false },
        { id: 'graycat', name: '灰猫', hp: 220, maxHp: 220, speed: 15, atb: 300, ready: false },
        { id: 'forge', name: '熔铸', hp: 240, maxHp: 240, speed: 11, atb: 100, ready: false },
        { id: 'birch', name: '白桦', hp: 320, maxHp: 320, speed: 9, atb: 500, ready: false },
      ],
      enemy: { id: 'enemy', name: '霓虹巡逻机兵', hp: 480, maxHp: 480, speed: 10, atb: 250, ready: false },
    };
  }
}
