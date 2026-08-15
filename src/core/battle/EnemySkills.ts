import type { EnemyArchetype,EnemySkill } from './BattleTypes';

export type EnemySkillTemplate = Omit<EnemySkill, 'id' | 'targetId'>;

export const enemySkillPool: EnemySkillTemplate[] = [
  { name: '撕裂', clashPower: 5, damage: 9, tempo: 2 },
  { name: '壓制', clashPower: 7, damage: 13, tempo: -2 },
  { name: '突進', clashPower: 6, damage: 11, tempo: 2, assist: true },
  { name: '破勢', clashPower: 4, damage: 8, tempo: 1 },
  { name: '猛擊', clashPower: 7, damage: 15, tempo: -3 },
];

export const enemyArchetypePools:Record<EnemyArchetype,EnemySkillTemplate[]>={
  swift:[{name:'疾走斬',clashPower:5,damage:9,tempo:3,balanceDamage:1,archetype:'swift'},{name:'追風突',clashPower:6,damage:10,tempo:2,assist:true,balanceDamage:1,archetype:'swift'},{name:'試探',clashPower:4,damage:7,tempo:4,balanceDamage:1,archetype:'swift'}],
  crusher:[{name:'鎮岳',clashPower:7,damage:15,tempo:-3,balanceDamage:3,archetype:'crusher'},{name:'碎構',clashPower:6,damage:12,tempo:-1,balanceDamage:3,archetype:'crusher'},{name:'沉肩',clashPower:5,damage:10,tempo:0,balanceDamage:2,archetype:'crusher'}],
  hexer:[{name:'咒裂',clashPower:5,damage:8,tempo:1,balanceDamage:2,archetype:'hexer'},{name:'縛足印',clashPower:4,damage:7,tempo:2,balanceDamage:2,archetype:'hexer'},{name:'返刃式',clashPower:6,damage:10,tempo:0,balanceDamage:2,archetype:'hexer'}],
};

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

export function dealEnemySkillsForArchetypes(archetypes:EnemyArchetype[],random:()=>number=Math.random){let highThreatUsed=false;return archetypes.map(type=>{const pool=shuffle(enemyArchetypePools[type],random),allowed=pool.filter(skill=>!highThreatUsed||skill.clashPower<7),skill=allowed[0]??pool.find(s=>s.clashPower<7)!;if(skill.clashPower>=7)highThreatUsed=true;return skill})}
