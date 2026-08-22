import {
  createActionDefinition,
  type ActionDefinition,
} from '../actions/ActionDefinition';

function eliteAction(
  id: string,
  name: string,
  damage: number,
  actionDelay: number,
  presentationProfile: ActionDefinition['presentationProfile'],
  telegraphLevel: ActionDefinition['telegraph']['level'] = 'normal',
): ActionDefinition {
  return createActionDefinition({
    id,
    owner: 'enemy',
    name,
    targetMode: 'single-enemy',
    hits: [{ damage }],
    actionDelay,
    statuses: [],
    clash: { mode: 'none', tags: [] },
    telegraph: { level: telegraphLevel },
    ai: { weight: 1 },
    counterplay: {
      delayable: true,
      interruptible: true,
      guardable: true,
      redirectable: true,
    },
    presentationProfile,
  });
}

export const RAIN_WARRIOR_ACTIONS: readonly ActionDefinition[] = [
  eliteAction('rain-warrior:step-in', '踏込', 10, 4, 'enemy-light'),
  eliteAction('rain-warrior:break-stance', '崩し', 8, 5, 'enemy-light'),
  eliteAction('rain-warrior:iai', '居合', 16, 7, 'enemy-heavy', 'danger'),
];

export const RAIN_WARRIOR_HP = 120;
export const RAIN_WARRIOR_BASE_RESILIENCE = 1;

export function rainWarriorActionAt(sequence: number): ActionDefinition {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error('rain-warrior action sequence must be a non-negative integer');
  }
  return createActionDefinition(RAIN_WARRIOR_ACTIONS[sequence % RAIN_WARRIOR_ACTIONS.length]!);
}
