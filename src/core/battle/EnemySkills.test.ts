import { describe, expect, it } from 'vitest';
import { createTeamDeck } from '../cards/BattleCards';
import { dealEnemySkills,dealEnemySkillsForArchetypes,enemyArchetypePools,enemySkillPool } from './EnemySkills';

describe('enemy intent counterplay', () => {
  it('never exceeds the strongest player clash card', () => {
    const playerMax = Math.max(...createTeamDeck().map((card) => card.clashPower));
    expect(Math.max(...enemySkillPool.map((skill) => skill.clashPower))).toBeLessThan(playerMax);
  });

  it('deals at most one high-power threat in a 4-enemy round', () => {
    for (let seed = 0; seed < 20; seed++) {
      const skills = dealEnemySkills(4, () => ((seed = seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      expect(skills.filter((skill) => skill.clashPower >= 7)).toHaveLength(1);
      expect(skills.some((skill) => skill.clashPower <= 5)).toBe(true);
    }
  });
  it('gives each enemy role a bounded finite intent pool',()=>{expect(enemyArchetypePools.swift.every(s=>s.tempo!>=2&&s.clashPower<=6)).toBe(true);expect(enemyArchetypePools.crusher.some(s=>s.balanceDamage===3)).toBe(true);expect(enemyArchetypePools.hexer.every(s=>s.clashPower<=6)).toBe(true)});
  it('keeps at most one power seven across mixed roles',()=>{for(let seed=0;seed<12;seed++){const dealt=dealEnemySkillsForArchetypes(['crusher','crusher','swift','hexer'],()=>((seed=seed*1664525+1013904223)>>>0)/4294967296);expect(dealt.filter(s=>s.clashPower>=7).length).toBeLessThanOrEqual(1);expect(dealt.some(s=>s.clashPower<=5)).toBe(true)}});
});
