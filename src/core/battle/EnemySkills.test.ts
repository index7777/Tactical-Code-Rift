import { describe, expect, it } from 'vitest';
import { createTeamDeck } from '../cards/BattleCards';
import { dealEnemySkills, enemySkillPool } from './EnemySkills';

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
});
