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
  swift:[{name:'疾走斬',clashPower:5,damage:9,tempo:3,balanceDamage:1,archetype:'swift',cue:'swift'},{name:'追風突',clashPower:6,damage:10,tempo:2,assist:true,balanceDamage:1,archetype:'swift',cue:'swift'},{name:'試探',clashPower:4,damage:7,tempo:4,balanceDamage:1,archetype:'swift',cue:'swift'}],
  crusher:[{name:'鎮岳',clashPower:7,damage:15,tempo:-3,balanceDamage:3,archetype:'crusher',cue:'heavy'},{name:'碎構',clashPower:6,damage:12,tempo:-1,balanceDamage:3,archetype:'crusher',cue:'heavy'},{name:'沉肩',clashPower:5,damage:10,tempo:0,balanceDamage:2,archetype:'crusher',cue:'heavy'}],
  hexer:[{name:'咒裂',clashPower:5,damage:8,tempo:1,balanceDamage:2,archetype:'hexer',cue:'hex'},{name:'縛足印',clashPower:4,damage:7,tempo:2,balanceDamage:2,archetype:'hexer',cue:'hex'},{name:'返刃式',clashPower:6,damage:10,tempo:0,balanceDamage:2,archetype:'hexer',cue:'hex'}],
  'wet-corpse':[{name:'柴刀斬',clashPower:5,damage:9,tempo:0,balanceDamage:1,archetype:'wet-corpse',cue:'heavy'},{name:'濡手',clashPower:4,damage:8,tempo:1,balanceDamage:1,archetype:'wet-corpse',cue:'heavy'}],
  'lantern-child':[{name:'鬼火疾走',clashPower:4,damage:7,tempo:5,balanceDamage:1,archetype:'lantern-child',cue:'swift'},{name:'燈影截',clashPower:5,damage:8,tempo:4,balanceDamage:1,archetype:'lantern-child',cue:'swift'}],
  'mountain-hound':[{name:'濡鬃撲咬',clashPower:4,damage:7,tempo:5,balanceDamage:1,archetype:'mountain-hound',cue:'swift'},{name:'山影追咬',clashPower:5,damage:8,tempo:4,balanceDamage:2,archetype:'mountain-hound',cue:'swift'}],
  'wayfarer-umbrella':[{name:'傘骨重劈',clashPower:7,damage:15,tempo:-3,balanceDamage:2,archetype:'wayfarer-umbrella',cue:'heavy'},{name:'開傘壓',clashPower:6,damage:12,tempo:-2,balanceDamage:3,archetype:'wayfarer-umbrella',cue:'heavy'}],
  'noose-ghost':[{name:'濕繩纏',clashPower:4,damage:6,tempo:1,balanceDamage:4,archetype:'noose-ghost',cue:'hex'},{name:'吊影',clashPower:5,damage:7,tempo:0,balanceDamage:4,archetype:'noose-ghost',cue:'hex'}],
  'lost-monk':[{name:'錫杖牽制',clashPower:4,damage:7,tempo:1,balanceDamage:2,archetype:'lost-monk',cue:'hex'},{name:'迷途印',clashPower:5,damage:8,tempo:0,balanceDamage:2,archetype:'lost-monk',cue:'hex'}],
  'rain-warrior':[{name:'居合',clashPower:7,damage:15,tempo:-2,balanceDamage:2,archetype:'rain-warrior',cue:'heavy'},{name:'踏込',clashPower:5,damage:10,tempo:2,balanceDamage:1,archetype:'rain-warrior',cue:'swift'},{name:'崩し',clashPower:4,damage:8,tempo:0,balanceDamage:4,archetype:'rain-warrior',cue:'hex'}],
  'rain-boss':[{name:'雨斬・終',clashPower:8,damage:18,tempo:-1,balanceDamage:3,archetype:'rain-boss',cue:'heavy'},{name:'山影連刃',clashPower:6,damage:12,tempo:2,assist:true,balanceDamage:2,archetype:'rain-boss',cue:'swift'}],
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

export function dealEnemySkillsForArchetypes(archetypes:EnemyArchetype[],random:()=>number=Math.random,previousNames:readonly(string|undefined)[]=[]){let highThreatUsed=false;return archetypes.map((type,index)=>{const pool=shuffle(enemyArchetypePools[type],random),nonRepeat=pool.filter(skill=>skill.name!==previousNames[index]),allowed=nonRepeat.filter(skill=>!highThreatUsed||skill.clashPower<7),fallback=pool.filter(skill=>!highThreatUsed||skill.clashPower<7),skill=allowed[0]??fallback[0]!;if(skill.clashPower>=7)highThreatUsed=true;return skill})}
