import { describe, expect, it } from 'vitest';
import { AtbBattle } from './AtbBattle';
const advance = (battle: AtbBattle, ms: number) => { for (let t = 0; t < ms; t += 50) battle.tick(50); };

describe('independent pulse timelines', () => {
  it('fills all four gauges independently from their own speed and initial value', () => {
    const battle = new AtbBattle(); advance(battle, 1500);
    expect(battle.state.heroes.find(h => h.id === 'yingli')?.ready).toBe(true);
    expect(battle.state.heroes.find(h => h.id === 'graycat')?.atb).not.toBe(battle.state.heroes.find(h => h.id === 'forge')?.atb);
  });
  it('only allows selecting a ready hero', () => {
    const battle = new AtbBattle();
    expect(battle.selectReadyHero('forge')).toBe(false);
    advance(battle, 1500);
    expect(battle.selectReadyHero('yingli')).toBe(true);
  });
  it('resets only the acting hero after target confirmation', () => {
    const battle = new AtbBattle(); advance(battle, 1500);
    const grayBefore = battle.state.heroes.find(h => h.id === 'graycat')!.atb;
    battle.selectReadyHero('yingli'); battle.chooseAttack(); battle.confirmTarget();
    expect(battle.state.heroes.find(h => h.id === 'yingli')!.atb).toBe(0);
    expect(battle.state.heroes.find(h => h.id === 'graycat')!.atb).toBe(grayBefore);
  });
  it('emits action events for both player and enemy attacks', () => {
    const battle = new AtbBattle(); advance(battle, 1500);
    battle.selectReadyHero('yingli'); battle.chooseAttack(); battle.confirmTarget();
    expect(battle.state.lastAction?.attackerId).toBe('yingli');
    advance(battle, 3000);
    expect(battle.state.lastAction?.attackerId).toBe('enemy');
  });
});
