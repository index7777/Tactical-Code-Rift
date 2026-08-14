import type { EnemySkill } from './BattleTypes';

export type EnemySkillTemplate = Omit<EnemySkill, 'id' | 'targetId'>;

export const enemySkillPool: EnemySkillTemplate[] = [
  { name: '撕裂', clashPower: 5, damage: 9, tempo: 2 },
  { name: '壓制', clashPower: 7, damage: 13, tempo: -2 },
  { name: '突進', clashPower: 6, damage: 11, tempo: 2, assist: true },
  { name: '破勢', clashPower: 4, damage: 8, tempo: 1 },
  { name: '猛擊', clashPower: 7, damage: 15, tempo: -3 },
];

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// A round may contain at most one power-7 threat. The remaining intents must
// expose normal counterplay to power-5/6 cards instead of demanding Heavy Slash.
export function dealEnemySkills(count: number, random: () => number = Math.random): EnemySkillTemplate[] {
  const threats = shuffle(enemySkillPool.filter((skill) => skill.clashPower >= 7), random);
  const normal = shuffle(enemySkillPool.filter((skill) => skill.clashPower < 7), random);
  const result = count > 0 ? [threats[0]!, ...normal] : [];
  while (result.length < count) result.push(normal[(result.length - 1) % normal.length]!);
  return shuffle(result.slice(0, count), random);
}
