import { describe, expect, it } from 'vitest';
import { advanceFrontline, MIN_CLASH_GAP, resolveCardPair, resolveRelay, returnClashToFormation, settleClashAtContact } from './RelayClash';
describe('RelayClash', () => {
  it('cancels equal attacks', () => expect(resolveCardPair({type:'ATK',power:3},{type:'ATK',power:3}).outcome).toBe('cancel'));
  it('breaks a weaker attack by the difference', () => expect(resolveCardPair({type:'ATK',power:3},{type:'ATK',power:2}).enemyDamage).toBe(1));
  it('blocks equal attack and defense', () => expect(resolveCardPair({type:'ATK',power:4},{type:'DEF',power:4}).outcome).toBe('enemy_block'));
  it('makes ultimate beat every normal card', () => expect(resolveCardPair({type:'ULT',power:8},{type:'DEF',power:99}).outcome).toBe('player_ult'));
  it('supports one to three relay slots', () => { expect(resolveRelay([{type:'ATK',power:3}],[{type:'DEF',power:2}])).toHaveLength(1); expect(resolveRelay(Array(3).fill({type:'ATK',power:3}),Array(3).fill({type:'ATK',power:3}))).toHaveLength(3); });
  it('keeps enemies left and players right without crossing', () => {
    let front = { enemyX: 430, playerX: 850 };
    const steps = resolveRelay([{type:'ATK',power:5},{type:'ATK',power:5},{type:'ATK',power:5}], [{type:'ATK',power:1},{type:'ATK',power:1},{type:'ATK',power:1}]);
    for (const step of steps) { front = advanceFrontline(front, step); expect(front.playerX - front.enemyX).toBeGreaterThanOrEqual(MIN_CLASH_GAP); }
  });
  it('settles a winning clash around its actual contact point',()=>{const step=resolveCardPair({type:'ATK',power:4},{type:'ATK',power:3});expect(settleClashAtContact(640,step)).toEqual({enemyX:510,playerX:654})});
  it('returns clash actors to formation while only the loser retreats',()=>{const step=resolveCardPair({type:'ATK',power:4},{type:'ATK',power:3});expect(returnClashToFormation({enemyX:280,playerX:1000},step)).toEqual({enemyX:170,playerX:1000})});
});
