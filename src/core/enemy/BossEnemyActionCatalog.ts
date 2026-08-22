import {
  createActionDefinition,
  type ActionDefinition,
} from '../actions/ActionDefinition';

export type RainBossPhase = 1 | 2 | 3;

function bossAction(
  definition: Omit<ActionDefinition, 'owner' | 'statuses' | 'clash' | 'counterplay'>,
): ActionDefinition {
  return createActionDefinition({
    ...definition,
    owner: 'enemy',
    statuses: [],
    clash: { mode: 'none', tags: [] },
    counterplay: {
      delayable: true,
      interruptible: true,
      guardable: true,
      redirectable: true,
    },
  });
}

export const RAIN_BOSS_ACTIONS: readonly ActionDefinition[] = [
  bossAction({
    id: 'rain-boss:rain-slash',
    name: '雨斬',
    targetMode: 'single-enemy',
    hits: [{ damage: 12 }],
    actionDelay: 5,
    telegraph: { level: 'normal' },
    ai: { weight: 1, minPhase: 1 },
    presentationProfile: 'enemy-heavy',
  }),
  bossAction({
    id: 'rain-boss:mountain-shadow-blades',
    name: '山影連刃',
    targetMode: 'single-enemy',
    hits: [{ damage: 6, repeats: 2 }],
    actionDelay: 5,
    telegraph: { level: 'normal' },
    ai: { weight: 1, minPhase: 1 },
    presentationProfile: 'enemy-heavy',
  }),
  bossAction({
    id: 'rain-boss:downpour-sweep',
    name: '驟雨橫掃',
    targetMode: 'all-enemies',
    hits: [{ damage: 8 }],
    actionDelay: 7,
    telegraph: { level: 'danger' },
    ai: { weight: 1, minPhase: 2 },
    presentationProfile: 'enemy-heavy',
  }),
  bossAction({
    id: 'rain-boss:pressure-rain',
    name: '壓雨',
    targetMode: 'single-enemy',
    hits: [{ damage: 10 }],
    actionDelay: 6,
    telegraph: { level: 'normal' },
    ai: { weight: 1, minPhase: 2 },
    presentationProfile: 'enemy-heavy',
  }),
  bossAction({
    id: 'rain-boss:final-rain',
    name: '終雨',
    targetMode: 'single-enemy',
    hits: [{ damage: 18 }],
    actionDelay: 8,
    telegraph: { level: 'signature' },
    ai: { weight: 1, cooldownActions: 2, minPhase: 3, maxPhase: 3 },
    presentationProfile: 'boss-signature',
  }),
];

export const RAIN_BOSS_HP = 240;
export const RAIN_BOSS_BASE_RESILIENCE = 1;

export function rainBossPhase(hp: number, maxHp: number): RainBossPhase {
  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0 || hp < 0 || hp > maxHp) {
    throw new Error('rain-boss HP must satisfy 0 <= hp <= maxHp and maxHp > 0');
  }

  const ratio = hp / maxHp;
  if (ratio > 0.7) return 1;
  if (ratio > 0.35) return 2;
  return 3;
}

export function rainBossActionsForPhase(phase: RainBossPhase): readonly ActionDefinition[] {
  return RAIN_BOSS_ACTIONS
    .filter((action) => {
      const min = action.ai?.minPhase ?? 1;
      const max = action.ai?.maxPhase ?? 3;
      return phase >= min && phase <= max;
    })
    .map((action) => createActionDefinition(action));
}

function cooldownSatisfied(
  action: ActionDefinition,
  recentActionIds: readonly string[],
): boolean {
  const cooldown = action.ai?.cooldownActions ?? 0;
  if (cooldown <= 0) return true;
  return !recentActionIds.slice(-cooldown).includes(action.id);
}

export interface RainBossActionSelectionInput {
  hp: number;
  maxHp?: number;
  sequence: number;
  recentActionIds?: readonly string[];
}

export function selectRainBossAction(input: RainBossActionSelectionInput): ActionDefinition {
  if (!Number.isInteger(input.sequence) || input.sequence < 0) {
    throw new Error('rain-boss action sequence must be a non-negative integer');
  }

  const phase = rainBossPhase(input.hp, input.maxHp ?? RAIN_BOSS_HP);
  const pool = rainBossActionsForPhase(phase);
  if (!pool.length) throw new Error(`rain-boss phase ${phase} has no eligible actions`);

  const recent = input.recentActionIds ?? [];
  const start = input.sequence % pool.length;
  for (let offset = 0; offset < pool.length; offset += 1) {
    const action = pool[(start + offset) % pool.length]!;
    if (cooldownSatisfied(action, recent)) return createActionDefinition(action);
  }

  const fallback = pool.find((action) => (action.ai?.cooldownActions ?? 0) === 0);
  if (!fallback) throw new Error(`rain-boss phase ${phase} has no cooldown-safe fallback`);
  return createActionDefinition(fallback);
}
